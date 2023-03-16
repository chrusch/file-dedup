// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {runCommand} from './run_command';
import {hashExtractor} from './hash_extractor';
import {aPath, Path} from '../common/path';
import {Duplex} from 'stream';
import which from 'which';
// import {hashFilesInWorkerThreads} from '../worker_threads/worker_threads';
import {queue} from 'async';
import workerpool from 'workerpool';

/** A pair consisting of the path of the file hashed and
  the SHA sum of the file content */
export type HashDatum = [Path, string];
export type HashData = HashDatum[];
export type Job2<T> = (dataItem: T, callback?: () => void) => Promise<void>;

export async function hashFile(
  file: Path,
  shasumCommand: Path
): Promise<HashDatum> {
  return await runCommand<HashDatum>(
    shasumCommand,
    ['-a', '256', file],
    stdout => [file, hashExtractor(stdout)]
  );
}

export async function commandExists(cmd: string) {
  return await which(cmd, {nothrow: true});
}

export async function hashAllCandidateFiles(
  // candidateFiles: Path[],
  nodeHashing: boolean
): Promise<Duplex> {
  const cmd = await commandExists('shasum');
  if (cmd && !nodeHashing) {
    return hashAllCandidateFilesWithShasumCommand(aPath(cmd));
  } else {
    // throw 'NOT YET IMPLEMENTED';
    return hashAllCandidateFilesWithNode();
  }
}

export function hashAllCandidateFilesWithShasumCommand(
  shasumCommand: Path
): Duplex {
  const hashData: HashData = [];
  const hashOneFile: Job2<Path> = async file => {
    hashData.push(await hashFile(file, shasumCommand));
  };

  // TODO: think carefully about the number of concurrent
  // jobs. Perhaps make it dependent on the number of processors
  const workQueue = queue(hashOneFile, 8);
  let noMoreJobsToComplete = false;
  workQueue.drain(() => {
    noMoreJobsToComplete = true;
  });

  let noMoreNewJobs = false;
  let timeout: NodeJS.Timeout | undefined | null;
  const hashStream: Duplex = new Duplex({
    objectMode: true,

    write(chunk, _endcoding, callback) {
      noMoreJobsToComplete = false;
      workQueue.push(chunk, err => {
        if (err) {
          console.log(err);
          return;
        }
        hashStream._read(1);
        // this._read(1);
      });
      callback();
    },
    read() {
      const pushDataOrExit = () => {
        if (hashData.length > 0) {
          while (hashData.length > 0) {
            this.push(hashData.shift());
          }
        } else if (noMoreNewJobs && noMoreJobsToComplete) {
          // we're done
          this.push(null);
        } else {
          if (timeout) {
            // never set a timeout if another one might still be active
            clearTimeout(timeout);
          }
          timeout = setTimeout(pushDataOrExit, 10);
        }
      };
      pushDataOrExit();
    },
  }).on('finish', () => {
    noMoreNewJobs = true;
  });

  return hashStream;
}

// export async function hashAllCandidateFilesWithNodeOld(
//   candidateFiles: Path[]
// ): Promise<HashData> {
//   const hashData: HashData = await hashFilesInWorkerThreads(candidateFiles);
//   return hashData;
// }

export function hashAllCandidateFilesWithNode(): Duplex {
  // TODO: think carefully about the number of concurrent
  // jobs. Perhaps make it dependent on the number of processors
  const maxWorkers = 6;
  const pool = workerpool.pool(__dirname + '/../worker_threads/worker.js', {
    minWorkers: 0,
    maxWorkers,
  });

  // run registered functions on the worker via exec
  // .catch(function (err) {
  //   console.error(err);
  // })
  // .then(function () {
  //   pool.terminate(); // terminate all workers when done
  // });

  let jobsBegun = 0;
  let jobsEnded = 0;
  const hashData: HashData = [];
  const hashOneFile= async (file: Path) => {
    try {
      const result = await pool.exec('nodeHashDigest', [file]);
      hashData.push(result);
      return result;
    } catch (e) {
      throw e;
    }
  };

  // const workQueue = queue(hashOneFile, 100);
  // let noMoreJobsToComplete = false;
  // workQueue.drain(() => {
  //   noMoreJobsToComplete = true;
  // });

  let noMoreNewJobs = false;
  let timeout: NodeJS.Timeout | undefined | null;
  const hashStream: Duplex = new Duplex({
    objectMode: true,

    write(chunk, _endcoding, callback) {
      jobsBegun++;
      // noMoreJobsToComplete = false;
      hashOneFile(chunk).then(
        () => {
          jobsEnded++;
          hashStream._read(1);
          callback();
        }
      ).catch((e) => {
        console.error(e);
      });
    },
    read() {
      // TODO: Make this a while loop
      const pushDataOrExit = () => {
        if (hashData.length > 0) {
          while (hashData.length > 0) {
            this.push(hashData.shift());
          }
        } else if (noMoreNewJobs && (jobsBegun === jobsEnded)) {
          // we're done
          pool.terminate();
          this.push(null);
        } else {
          if (timeout) {
            // never set a timeout if another one might still be active
            clearTimeout(timeout);
          }
          timeout = setTimeout(pushDataOrExit, 10);
        }
      };
      pushDataOrExit();
    },
  }).on('finish', () => {
    noMoreNewJobs = true;
  });

  return hashStream;
}
