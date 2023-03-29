// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {getFindDuplicatesStream} from './find_duplicates/duplicates';
import {getHandleDuplicatesStream} from './handle_duplicates/remove_duplicates';
import {hashAllCandidateFiles} from './hash_file/hash_files';
import {getCandidateFilesStream} from './candidate_files/get_candidate_files';
import {VerifiedDirectoryPath} from './common/verified_directory_path';

export type DedupOptions = {
  dirsToPossiblyDeleteFrom: VerifiedDirectoryPath[];
  exclude: readonly string[];
  followSymlinks: boolean;
  includeDotfiles: boolean;
  interactiveDeletion: boolean;
  nodeHashing: boolean;
  pathsToTraverse: VerifiedDirectoryPath[];
  reallyDelete: boolean;
};

// Deduplicate files.
//
// Given one or more directories, traverse them fully, finding all duplicate
// files. Print out these duplicates or optionally delete them depending on the
// exact options provided.
export async function dedup(options: Readonly<DedupOptions>): Promise<void> {
  const candidateFilesStream = getCandidateFilesStream(options);

  const hashDataStream = await hashAllCandidateFiles(options.nodeHashing);

  const handleDuplicatesStream = getHandleDuplicatesStream(
    options.dirsToPossiblyDeleteFrom,
    options.reallyDelete,
    options.interactiveDeletion
  );

  await new Promise(resolve => {
    candidateFilesStream
      .pipe(hashDataStream)
      .pipe(getFindDuplicatesStream())
      .pipe(handleDuplicatesStream)
      .on('finish', resolve);
  });
}
