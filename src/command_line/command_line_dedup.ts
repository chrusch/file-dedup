// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {commandLineOptions, Options} from './command_line';
import {DedupOptions} from '../dedup';
import {verifyDirectoryPaths} from '../common/verified_directory_path';

/** For now we always exclude these directories. Later we might allow the user to
 * choose. */
export const exclude = ['node_modules', '.git'];

/**
 * Get options from the command line and process them into a more useful form.
 *
 * @param argv - The arguments passed to the program through the command line
 * @returns An object representing deduplication options
 */
export function getDedupOptionsFromCommandLine(
  argv: readonly string[]
): DedupOptions {
  const [options, args] = commandLineOptions(argv);
  return processOptions(options, args);
}

/**
 * Process the command line options into a more useful form.
 *
 * @param options - The options as returned by commandLineOptions()
 * @param args - The arguments as returned by commandLineOptions()
 * @returns A complete DedupOptions object
 */
export function processOptions(options: Options, args: string[]): DedupOptions {
  const includeDotfiles = options.dotFiles;
  const interactiveDeletion = options.interactive;
  const followSymlinks = options.followSymlinks;
  const reallyDelete = options.reallyDelete;
  const commandLineHashing = options.commandLineHashing;

  const paths: readonly string[] = options.paths;
  const dirsToPossiblyDeleteFrom = verifyDirectoryPaths(...paths);
  const pathsToTraverse = verifyDirectoryPaths(...args);

  return {
    dirsToPossiblyDeleteFrom,
    exclude,
    followSymlinks,
    includeDotfiles,
    interactiveDeletion,
    commandLineHashing,
    pathsToTraverse,
    reallyDelete,
  };
}
