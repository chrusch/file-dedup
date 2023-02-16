// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {commandLineOptions, Options} from './command_line';
import {DedupOptions} from '../dedup';
import {verifyDirectoryPaths} from '../common/verified_directory_path';

// For now we always exclude these directories.
// Later we can allow the user to choose.
export const exclude = ['node_modules', '.git'];

/**
 * Get options from the command line and list duplicate files or
 * delete duplicate files according to the specific options given.
 *
 * @param argv - The arguments passed to the program through the command line
 */
export function getDedupOptionsFromCommandLine(
  argv: readonly string[]
): DedupOptions {
  const [options, args] = commandLineOptions(argv);
  return processOptions(options, args);
}

export function processOptions(options: Options, args: string[]): DedupOptions {
  const includeDotfiles = options.dotFiles;
  const interactiveDeletion = options.interactive;
  const followSymlinks = options.followSymlinks;
  const reallyDelete = options.reallyDelete;
  const nodeHashing = options.nodeHashing;

  const paths: readonly string[] = options.paths;
  const dirsToPossiblyDeleteFrom = verifyDirectoryPaths(...paths);
  const pathsToTraverse = verifyDirectoryPaths(...args);

  return {
    dirsToPossiblyDeleteFrom,
    exclude,
    followSymlinks,
    includeDotfiles,
    interactiveDeletion,
    nodeHashing,
    pathsToTraverse,
    reallyDelete,
  };
}
