// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

// TODO: Make node hashing the default since it is faster
import {runCommand} from './run_command';
import {hashExtractor} from './hash_extractor';
import {aPath, Path} from '../common/path';
import {Duplex, Transform} from 'stream';
import which from 'which';
import {queue} from 'async';
import retry from 'async-retry';
import workerpool from 'workerpool';

/** A pair consisting of the path of the file hashed and
  the SHA sum of the file content */
export type HashDatum = [Path, string];
export type HashData = HashDatum[];

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

export async function commandExists(cmd: string) {
  return await which(cmd, {nothrow: true});
}

export async function hashAllCandidateFiles(
  nodeHashing: boolean
): Promise<Duplex> {
  const cmd = await commandExists('shasum');
  // TODO make concurrency dependent on number of processors
  // TODO test unreadable directory
  const concurrency = 8;
  if (cmd && !nodeHashing) {
    return hashAllCandidateFilesWithShasumCommand(aPath(cmd), concurrency);
  } else {
    return hashAllCandidateFilesWithNode(concurrency);
  }
}

const hashFileWithRetry = async (file: Path, shasumCommand: Path) => {
  const retryFunction = () => hashFile(file, shasumCommand);
  // retries if retryFunction throws an error
  return await retry(retryFunction, {
    retries: 3,
    minTimeout: 50, // time between retries
    maxTimeout: 500, // time between retries
  });
};

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

export function hashAllCandidateFilesWithNode(
  concurrency: number
): Transform {
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
        const stats= pool.stats();
        if (stats.busyWorkers === 0 &&
            stats.pendingTasks === 0 &&
              stats.activeTasks === 0) {
          pool.terminate()
          callback(); // done!
        } else {
          setTimeout(checkWhetherWeAreDone, 80); // try again later
        }
      };
      checkWhetherWeAreDone();
    },
  });
}
