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

/**
 * Returns a Readable stream of candidate files.
 *
 * @remarks
 *
 *
 * A candidate file is a regular file that can be found in pathsToTraverse or
 * dirsToPossiblyDeleteFrom or their subdirectories and that has a non-unique
 * size. Candidate files just might possibly have duplicate contents. That's why
 * we are interested in them.
 *
 * @param options - {@link CandidateFileOptions} @returns - A Readable
 * stream--really a Transform stream that can be used as a Readable stream.
 */
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
