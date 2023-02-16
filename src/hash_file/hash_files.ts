// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {runCommand} from './run_command';
import {hashExtractor} from './hash_extractor';
import {aPath, Path} from '../common/path';
import which from 'which';
import {
  doAllWorkInQueue,
  makeWorkQueue,
  Job,
  WorkQueue,
} from '../work_queue/work_queue';
import {hashFilesInWorkerThreads} from '../worker_threads/worker_threads';

/** A pair consisting of the path of the file hashed and
  the SHA sum of the file content */
export type HashDatum = [Path, string];
export type HashData = HashDatum[];

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
  candidateFiles: Path[],
  nodeHashing: boolean
) {
  const cmd = await commandExists('shasum');
  if (cmd && !nodeHashing) {
    return await hashAllCandidateFilesWithShasumCommand(
      candidateFiles,
      aPath(cmd)
    );
  } else {
    return await hashAllCandidateFilesWithNode(candidateFiles);
  }
}

export async function hashAllCandidateFilesWithShasumCommand(
  candidateFiles: Path[],
  shasumCommand: Path
): Promise<HashData> {
  const hashData: HashData = [];
  const hashOneFile: Job<Path> = async file => {
    hashData.push(await hashFile(file, shasumCommand));
  };

  // create a job queue to hash all candidate files
  // using parallel processing
  const workQueue: WorkQueue = makeWorkQueue(candidateFiles, hashOneFile);
  await doAllWorkInQueue(workQueue, 100);
  return hashData;
}

export async function hashAllCandidateFilesWithNode(
  candidateFiles: Path[]
): Promise<HashData> {
  const hashData: HashData = await hashFilesInWorkerThreads(candidateFiles);
  return hashData;
}
