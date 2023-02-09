// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {getFilePaths, filesWithNonUniqueSizes} from './directories';
import {FileWithSize} from './one_path_per_inode';
import {Path} from '../common/path';
import {VerifiedDirectoryPath} from '../common/verified_directory_path';

export interface CandidateFilesOptions {
  pathsToTraverse: VerifiedDirectoryPath[];
  dirsToPossiblyDeleteFrom: VerifiedDirectoryPath[];
  exclude: readonly string[];
  followSymlinks: boolean;
  includeDotfiles: boolean;
}

// Given one or more directories, traverse them, optionally excluding certain
// specified files and directories, and optionally including hidden dot files.
// Filter out all files with unique sizes (they can't be duplicates), and
// return an array of the paths of the all files with non-unique sizes.
export function getCandidateFiles(
  options: Readonly<CandidateFilesOptions>
): Path[] {
  const dirsToTraverse = [
    ...options.pathsToTraverse,
    ...options.dirsToPossiblyDeleteFrom,
  ];
  const filesWithSizes: FileWithSize[] = getFilePaths(
    dirsToTraverse,
    options.exclude,
    options.followSymlinks,
    options.includeDotfiles
  );

  // no longer needed
  // Deal properly with hard links by considering only one path per inode.
  // const filesWithSizes: FileWithSize[] = onePathPerInode(
  //   filesWithSizesAndInodes
  // );

  // Every file with a unique file size has unique content. Consequently, files
  // with a unique size do not need to be hashed, because they can't possibly be
  // duplicates.
  const files: Path[] = filesWithNonUniqueSizes(filesWithSizes);
  return files;
}
