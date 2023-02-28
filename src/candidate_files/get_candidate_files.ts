// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {filesWithNonUniqueSizesStream} from './directories';
import {Path} from '../common/path';
import {VerifiedDirectoryPath} from '../common/verified_directory_path';
import {createDirectoryReadingStream} from './read_directory';
import {Transform} from 'node:stream';

export type FileWithSize = [Path, number];

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
): Transform {
  const dirsToTraverse = [
    ...options.pathsToTraverse,
    ...options.dirsToPossiblyDeleteFrom,
  ];

  return createDirectoryReadingStream(
    dirsToTraverse,
    options.exclude,
    options.followSymlinks,
    options.includeDotfiles
  ).pipe(filesWithNonUniqueSizesStream);

  // Every file with a unique file size has unique content. Consequently, files
  // with a unique size do not need to be hashed, because they can't possibly be
  // duplicates.
}
