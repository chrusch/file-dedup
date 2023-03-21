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
// import {hashFilesInWorkerThreads} from '../worker_threads/worker_threads';
import {queue} from 'async';
import workerpool from 'workerpool';

/** A pair consisting of the path of the file hashed and
  the SHA sum of the file content */
export type HashDatum = [Path, string];
export type HashData = HashDatum[];
type Job4<T> = (dataItem: T, shasumCommand: Path) => Promise<void | HashDatum>;

export async function hashFile(
  file: Path,
  shasumCommand: Path
): Promise<HashDatum> {
  return await runCommand<HashDatum>(
    shasumCommand,
    ['-a', '256', file],
    (stdout, args) => [file, hashExtractor(stdout, args)]
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

// FIXME: Job4? Do we need that? Can we get rid of it
// or give it a more desriptive name?
// TODO: async/await syntax instead of promise syntax
const hashOneFile: Job4<Path> = async (file: Path, shasumCommand: Path) => {
  return hashFile(file, shasumCommand).catch(error => {
    // FIXME: this catch is fine for EAGAIN errors where it makes
    // sense to try again, but consider the possibility of other errors
    // Also try rety or retryable
    // Eventually errors should just throw an error to be dealt with elsewhere
    // in the coode
    // Deal properly with permission denied error
    console.log('in catch', error.message);
    setTimeout(() => hashOneFile(file, shasumCommand), 50);
  });
};

export function hashAllCandidateFilesWithShasumCommand(
  shasumCommand: Path
): Transform {
  const hashAFile = async (file: Path) => hashOneFile(file, shasumCommand);
  // TODO: Make number of concurrent jobs dependent on the number of processors
  const workQueue = queue(hashAFile, 8);

  const hashStream: Transform = new Transform({
    objectMode: true,

    transform(chunk, _endcoding, callback) {
      workQueue
        .push(chunk)
        .then(result => {
          this.push(result);
        })
        .catch(err => {
          console.error(err);
        });
      // the callback must run immediately after the job enters
      // the queue to benefit from queue parallism
      callback();
    },
    flush(callback) {
      const checkWhetherWeAreDone = () => {
        if (workQueue.idle()) {
          // we are done processing all data
          callback();
        } else {
          // not quite done. try again later
          setTimeout(checkWhetherWeAreDone, 80);
        }
      };
      checkWhetherWeAreDone();
    },
  });

  return hashStream;
}

export function hashAllCandidateFilesWithNode(): Duplex {
  // TODO: think carefully about the number of concurrent
  // jobs. Perhaps make it dependent on the number of processors
  const maxWorkers = 8;
  const pool = workerpool.pool(__dirname + '/../worker_threads/worker.js', {
    minWorkers: 0,
    maxWorkers,
  });

  const hashData: HashData = [];
  const hashOneFile = async (file: Path) => {
    try {
      const result = await pool.exec('nodeHashDigest', [file]);
      hashData.push(result);
      return result;
    } catch (e) {
      console.log('found eror in hashOneFile');
      throw e;
    }
  };

  let noMoreNewJobs = false;
  let timeout: NodeJS.Timeout | undefined | null;
  let jobsBegun = 0;
  let jobsEnded = 0;
  const hashStream: Duplex = new Duplex({
    objectMode: true,
    writableHighWaterMark: 1,

    write(chunk, _endcoding, callback) {
      jobsBegun++;
      hashOneFile(chunk)
        .then(() => {
          jobsEnded++;
          hashStream._read(1);
        })
        .catch(e => {
          console.error(e);
        });
      callback();
    },
    read() {
      const pushDataOrExit = () => {
        if (hashData.length > 0) {
          while (hashData.length > 0) {
            this.push(hashData.shift());
          }
        } else if (noMoreNewJobs && jobsBegun === jobsEnded) {
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
