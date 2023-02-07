// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {commandLineOptions, Options} from './command_line';
import {dedup, DedupOptions} from './dedup';
import {verifyDirectoryPaths} from './verified_directory_path';

// For now we always exclude these directories.
// Later we can allow the user to choose.
export const exclude = ['node_modules', '.git'];

/**
 * Get options from the command line and list duplicate files or
 * delete duplicate files according to the specific options given.
 *
 * @param argv - The arguments passed to the program through the command line
 */
export async function commandLineDedup(argv: readonly string[]): Promise<void> {
  const [options, args] = commandLineOptions(argv);
  const dedupOptions = processOptions(options, args);
  await dedup(dedupOptions);
}

export function processOptions(options: Options, args: string[]): DedupOptions {
  const interactiveDeletion = options.interactive;
  const reallyDelete = options.reallyDelete;
  const includeDotfiles = options.dotFiles;
  const paths: readonly string[] = options.paths;
  const dirsToPossiblyDeleteFrom = verifyDirectoryPaths(...paths);
  const pathsToTraverse = verifyDirectoryPaths(...args);
  const followSymlinks = options.followSymlinks;

  return {
    dirsToPossiblyDeleteFrom,
    exclude,
    followSymlinks,
    includeDotfiles,
    interactiveDeletion,
    pathsToTraverse,
    reallyDelete,
  };
}
