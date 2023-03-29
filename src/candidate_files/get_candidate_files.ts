// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {filesWithNonUniqueSizesStream} from './directories';
import {Path} from '../common/path';
import {VerifiedDirectoryPath} from '../common/verified_directory_path';
import {createDirectoryReadingStream} from './read_directory';
import {Readable} from 'node:stream';

/** The path to a file and a number indicating it's size in bytes */
export type FileWithSize = [Path, number];

/**
 * An object representing the options to getCandidateFiles
 *
 * @param pathsToTraverse - A list of verified directories to look for
 *        duplicates in
 * @param dirsToPossiblyDeleteFrom - More directories to look for duplicates in
 *        and that later in the process will be subject to automatic deletion
 * @param exclude - Names of files and directories to ignore, for example,
 *        "node_modules" or ".git"
 * @param followSymlinks - Policy on symlinks. True follows them, false
 *        ignores them
 * @param includeDotfiles - If false, will ignore all files beginning with a
 *        dot ('.'). If true, treats dot files like any other file.
 */
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
//
  // Every file with a unique file size necessarily has unique content. Consequently, files
  // with a unique size do not need to be hashed, because they can't possibly be
  // duplicates.
export function getCandidateFilesStream(
  options: Readonly<CandidateFilesOptions>
): Readable {
  const dirsToTraverse = [
    ...options.pathsToTraverse,
    ...options.dirsToPossiblyDeleteFrom,
  ];

  return createDirectoryReadingStream(
    dirsToTraverse,
    options.exclude,
    options.followSymlinks,
    options.includeDotfiles
  ).pipe(new filesWithNonUniqueSizesStream());
}
