// Copyright (c) 2022, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

//./src/dedup.ts
import {getDuplicates} from './duplicates';
import {deleteOrListDuplicates} from './remove_duplicates';
import {hashFile} from './hash_files';
import {doAllWorkInQueue, makeWorkQueue, Job, WorkQueue} from './work_queue';
import {getCandidateFiles} from './get_candidate_files';

export type DedupOptions = {
  dirsToPossiblyDeleteFrom: string[];
  exclude: string[];
  includeDotfiles: boolean;
  interactiveDeletion: boolean;
  pathsToTraverse: string[];
  reallyDelete: boolean;
};

export type HashData = [string, string][];

// Deduplicate files.
//
// Given one or more directories, traverse them fully, finding all duplicate
// files. Print out these duplicates or optionally delete them depending on the
// exact options provided.
export async function dedup(options: DedupOptions): Promise<void> {
  // Get files that might potentially be duplicates.
  const candidateFiles = getCandidateFiles(options);
  const hashData: HashData = [];
  const hashOneFile: Job<string> = (file, onHashComplete) => {
    hashFile(file, onHashComplete, hashData);
  };

  // create a job queue to hash all candidate files
  // using parallel processing
  const workQueue: WorkQueue = makeWorkQueue<string>(
    candidateFiles,
    hashOneFile
  );
  await doAllWorkInQueue(workQueue, 100);

  const duplicateFiles: string[][] = getDuplicates(hashData);

  deleteOrListDuplicates(
    duplicateFiles,
    options.dirsToPossiblyDeleteFrom,
    options.reallyDelete,
    options.interactiveDeletion
  );
}
