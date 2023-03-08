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
import {hashFilesInWorkerThreads} from '../worker_threads/worker_threads';
import {queue} from 'async';

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
    throw 'NOT YET IMPLEMENTED';
    // return await hashAllCandidateFilesWithNode(candidateFiles);
  }
}

export function hashAllCandidateFilesWithShasumCommand(
  shasumCommand: Path
): Duplex {
  const hashData: HashData = [];
  const hashOneFile: Job2<Path> = async file => {
    hashData.push(await hashFile(file, shasumCommand));
  };

  const workQueue = queue(hashOneFile, 100);
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

export async function hashAllCandidateFilesWithNode(
  candidateFiles: Path[]
): Promise<HashData> {
  const hashData: HashData = await hashFilesInWorkerThreads(candidateFiles);
  return hashData;
}
