// Copyright (c) 2022, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {getFilePaths, filesWithNonUniqueSizes} from './directories';
import {
  FileWithSize,
  FileWithSizeAndInode,
  onePathPerInode,
} from './one_path_per_inode';

export interface CandidateFilesOptions {
  pathsToTraverse: readonly string[];
  dirsToPossiblyDeleteFrom: readonly string[];
  exclude: readonly string[];
  includeDotfiles: boolean;
}

// Given one or more directories, traverse them, optionally excluding certain
// specified files and directories, and optionally including hidden dot files.
// Filter out all files with unique sizes (they can't be duplicates), and
// return an array of the paths of the all files with non-unique sizes.
export function getCandidateFiles(
  options: Readonly<CandidateFilesOptions>
): string[] {
  const dirsToTraverse = [
    ...options.pathsToTraverse,
    ...options.dirsToPossiblyDeleteFrom,
  ];
  const filesWithSizesAndInodes: FileWithSizeAndInode[] = getFilePaths(
    dirsToTraverse,
    options.exclude,
    options.includeDotfiles
  );

  // Deal properly with hard links by considering only one path per inode.
  const filesWithSizes: FileWithSize[] = onePathPerInode(
    filesWithSizesAndInodes
  );

  // Every file with a unique file size has unique content. Consequently, files
  // with a unique size do not need to be hashed, because they can't possibly be
  // duplicates.
  const files: string[] = filesWithNonUniqueSizes(filesWithSizes);
  return files;
}
