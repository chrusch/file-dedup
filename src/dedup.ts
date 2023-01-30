// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {getDuplicates} from './duplicates';
import {deleteOrListDuplicates} from './remove_duplicates';
import {hashFile} from './hash_files';
import {doAllWorkInQueue, makeWorkQueue, Job, WorkQueue} from './work_queue';
import {getCandidateFiles} from './get_candidate_files';
import {VerifiedDirectoryPath} from './verified_directory_path';
import {Path} from './path';

export type DedupOptions = {
  dirsToPossiblyDeleteFrom: VerifiedDirectoryPath[];
  exclude: readonly string[];
  followSymlinks: boolean;
  includeDotfiles: boolean;
  interactiveDeletion: boolean;
  pathsToTraverse: VerifiedDirectoryPath[];
  reallyDelete: boolean;
};

export type HashDatum = readonly [Path, string];
export type HashData = HashDatum[];

// Deduplicate files.
//
// Given one or more directories, traverse them fully, finding all duplicate
// files. Print out these duplicates or optionally delete them depending on the
// exact options provided.
export async function dedup(options: Readonly<DedupOptions>): Promise<void> {
  // Get files that might potentially be duplicates.
  const candidateFiles = getCandidateFiles(options);
  const hashData: HashData = [];
  const hashOneFile: Job<Path> = async file => {
    hashData.push(await hashFile(file));
  };

  // create a job queue to hash all candidate files
  // using parallel processing
  const workQueue: WorkQueue = makeWorkQueue<Path>(candidateFiles, hashOneFile);
  await doAllWorkInQueue(workQueue, 100);

  const duplicateFiles: Path[][] = getDuplicates(hashData);

  deleteOrListDuplicates(
    duplicateFiles,
    options.dirsToPossiblyDeleteFrom,
    options.reallyDelete,
    options.interactiveDeletion
  );
}
