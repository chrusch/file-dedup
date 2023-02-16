// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {getDuplicates} from './find_duplicates/duplicates';
import {deleteOrListDuplicates} from './handle_duplicates/remove_duplicates';
import {hashAllCandidateFiles} from './hash_file/hash_files';
import {getCandidateFiles} from './candidate_files/get_candidate_files';
import {VerifiedDirectoryPath} from './common/verified_directory_path';
import {Path} from './common/path';

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
  const candidateFiles = getCandidateFiles(options);

  const hashData = await hashAllCandidateFiles(
    candidateFiles,
    options.nodeHashing
  );

  const duplicateFiles: Path[][] = getDuplicates(hashData);

  deleteOrListDuplicates(
    duplicateFiles,
    options.dirsToPossiblyDeleteFrom,
    options.reallyDelete,
    options.interactiveDeletion
  );
}
