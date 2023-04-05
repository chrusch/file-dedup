// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {runCommand} from './run_command';
import {hashExtractor} from './hash_extractor';
import {Path} from '../common/path';
import {Transform} from 'stream';
import {queue} from 'async';
import retry from 'async-retry';
import {HashDatum} from '../hash_file/hash_files';

/**
 * Returns the hash digest of a file using the shasum command line tool
 *
 * @param file - The path to the file to be hashed
 * @param shasumCommand - The path to the shasum executable
 * @returns A promise resolving to a tuple that contains the filename and hash
 *          digest, or else null if the file is unreadable.
 * @throws An error if runCommand throws any error other than "Permission
 *         denied." This error can be used by the calling function to trigger a
 *         retry.
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
