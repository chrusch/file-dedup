// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

// TODO: Make node hashing the default since it is faster
import {runCommand} from './run_command';
import {hashExtractor} from './hash_extractor';
import {aPath, Path} from '../common/path';
import {Transform} from 'stream';
import which from 'which';
import {queue} from 'async';
import retry from 'async-retry';
import workerpool from 'workerpool';
import os from 'node:os';

/** A pair consisting of the path of the file hashed and
  the SHA sum of the file content */
export type HashDatum = [Path, string];
/** An array of HashDatum tuples */
export type HashData = HashDatum[];

/**
 * Returns the hash digest of a file using the shasum command line tool
 *
 * @param file - The path to the file to be hashed
 * @param shasumCommand - The path to the shasum executable
 * @returns A promise resolving to a tuple that contains the filename and hash digest, or else null if the file is unreadable.
 */
export async function hashFile(
  file: Path,
  shasumCommand: Path
): Promise<HashDatum | null> {
  try {
    return await runCommand<HashDatum>(
      shasumCommand,
      ['-a', '256', file],
      (stdout, args) => [file, hashExtractor(stdout, args)]
    );
  } catch (error) {
    if ((error as {message: string}).message.match(/Permission denied/)) {
      return null; // return null. don't retry.
    } else {
      throw error; // throw error. try again.
    }
  }
}

/**
 * Determine the location of the given command in the current PATH.
 *
 * @param cmd - The name of the command
 * @returns A promise resolving to path of the command if it can be found in
 *          the current path
 */
export async function commandExists(cmd: string): Promise<string> {
  return await which(cmd, {nothrow: true});
}

/**
 * Returns a transform stream that can be used to get the hash digest of files
 *
 * @param nodeHashing - Calculate the hash digest using node libraries as opposed to using the shasum command line tool?
 * @returns A stream that can be used to calculate the hash digest of input files.
 */
export async function hashAllCandidateFiles(
  nodeHashing: boolean
): Promise<Transform> {
  const cmd = await commandExists('shasum');
  // TODO test unreadable directory
  // TODO with future versions of node, use os.availableParallelism()
  // instead of os.cpus().length
  const concurrency = os.cpus().length;
  if (cmd && !nodeHashing) {
    return hashAllCandidateFilesWithShasumCommand(aPath(cmd), concurrency);
  } else {
    return hashAllCandidateFilesWithNode(concurrency);
  }
}

/**
 * Wrapper function that retries calculating the hash digest of a file if the first attempt fails.
 *
 * @param file - The path to a file to be hashed
 * @param shasumCommand - The path to the system's shasum command line tool
 * @returns A promise resolving to a HashDatum or else to null if hashing ultimately fails after retries
 */
// TODO test/document whether an error is thrown if all retries fail?
const hashFileWithRetry = async (
  file: Path,
  shasumCommand: Path
): Promise<HashDatum | null> => {
  const retryFunction = () => hashFile(file, shasumCommand);
  // retries if retryFunction throws an error
  return await retry(retryFunction, {
    retries: 3,
    minTimeout: 50, // time between retries
    maxTimeout: 500, // time between retries
  });
};

/**
 * Returns a stream that can be used to hash input files with the local system's shasum command.
 *
 * @param shasumCommand - The path to the system's shasum command line tool
 * @param concurrency - The number of files to hash in parallel. It is recommended that this number should be no larger than the number of processors on the system
 * @returns A Transform stream that can be used to hash input files
 */
export function hashAllCandidateFilesWithShasumCommand(
  shasumCommand: Path,
  concurrency: number
): Transform {
  const hashFileWithRetryWrapper = async (file: Path) =>
    hashFileWithRetry(file, shasumCommand);
  const workQueue = queue(hashFileWithRetryWrapper, concurrency);

  return new Transform({
    objectMode: true,

    transform(filePath, _enc, callback) {
      workQueue
        .push(filePath)
        .then(result => {
          if (result) {
            this.push(result);
          }
        })
        .catch(err => {
          console.log('found an unexpected error', err);
        });
      // the callback must run right after the job enters
      // the queue to benefit from work queue parallelism
      callback();
    },

    flush(callback) {
      const checkWhetherWeAreDone = () => {
        if (workQueue.idle()) {
          callback(); // done!
        } else {
          setTimeout(checkWhetherWeAreDone, 80); // try again later
        }
      };
      checkWhetherWeAreDone();
    },
  });
}

/**
 * Returns a stream that can be used to hash input files using popular node hashing libraries.
 *
 * @param concurrency - The number of files to hash in parallel. It is recommended that this number should be no larger than the number of processors on the system
 * @returns A Transform stream that can be used to hash input files
 */
//TODO implement retrying
export function hashAllCandidateFilesWithNode(concurrency: number): Transform {
  const pool = workerpool.pool(__dirname + '/../worker_threads/worker.js', {
    minWorkers: 0,
    maxWorkers: concurrency,
  });

  const hashOneFile = async (file: Path) => {
    try {
      const result = await pool.exec('nodeHashDigest', [file]);
      return result;
    } catch (e) {
      console.log('found eror in hashOneFile');
      throw e;
    }
  };

  // const hashFileWithRetryWrapper = (file: Path) =>
  //   hashFileWithRetry(file, shasumCommand);
  // const workQueue = queue(hashFileWithRetryWrapper, concurrency);

  return new Transform({
    objectMode: true,

    transform(filePath, _enc, callback) {
      hashOneFile(filePath)
        .then(result => {
          if (result) {
            this.push(result);
          }
        })
        .catch(err => {
          console.log('found an unexpected error', err);
        });
      // the callback must run right after the job enters
      // the queue to benefit from work queue parallelism
      callback();
    },

    flush(callback) {
      const checkWhetherWeAreDone = () => {
        const stats = pool.stats();
        if (
          stats.busyWorkers === 0 &&
          stats.pendingTasks === 0 &&
          stats.activeTasks === 0
        ) {
          pool.terminate();
          callback(); // done!
        } else {
          setTimeout(checkWhetherWeAreDone, 80); // try again later
        }
      };
      checkWhetherWeAreDone();
    },
  });
}
