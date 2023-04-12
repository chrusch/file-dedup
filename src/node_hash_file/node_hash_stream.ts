// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {Path} from '../common/path';
import {Transform} from 'stream';
import workerpool from 'workerpool';
import {getRealPath} from '../common/dir_name';

// Can't simply use __dirname here because of its unexpected value in jest
const pathOfWorker = getRealPath('worker_threads/worker.js');

/**
 * Returns a stream that can be used to hash input files using popular node hashing libraries.
 *
 * @param concurrency - The number of files to hash in parallel. It is recommended that this number should be no larger than the number of processors on the system
 * @returns A Transform stream that can be used to hash input files
 */
//TODO implement retrying
export function hashAllCandidateFilesWithNode(concurrency: number): Transform {
  const pool = workerpool.pool(pathOfWorker, {
    minWorkers: 0,
    maxWorkers: concurrency,
  });

  const hashOneFile = async (file: Path) => {
    try {
      const result = await pool.exec('nodeHashDigest', [file]);
      return result;
    } catch (e) {
      // console.log('found eror in hashOneFile');
      const err = e as {message: string};
      throw new Error(`found error in hasOneFile: ${err.message}`);
    }
  };

  // const hashFileWithRetryWrapper = (file: Path) =>
  //   hashFileWithRetry(file, shasumCommand);
  // const workQueue = queue(hashFileWithRetryWrapper, concurrency);

  return new Transform({
    objectMode: true,

    transform(filePath: Path, _enc, callback) {
      hashOneFile(filePath)
        .then(result => {
          if (result) {
            this.push(result);
          }
        })
        .catch(() => {
          // console.log('found an unexpected error', err);
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
