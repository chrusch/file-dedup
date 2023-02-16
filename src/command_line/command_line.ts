// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {Command} from 'commander';

/** How this program runs depends on the options given on the command line. */
export interface Options {
  /** interactively delete duplicate files */
  interactive: boolean;
  /** read dot files and descend into dot directories? */
  dotFiles: boolean;
  /** follow symlinks while traversing directory structures? */
  followSymlinks: boolean;
  /** use node's buildin crypto library to calculuate the hash digest of files? */
  nodeHashing: boolean;
  /** paths to non-interactively delete files in */
  paths: readonly string[];
  /** confirmation that the user really wants to let the program delete files
   * according to the given options */
  reallyDelete: boolean;
}

// there might be an option for exlcuding empty files or files up to a
// certain size OR possibly for including them.
// option to remove empty directories
export function commandLineOptions(
  argv: readonly string[]
): [Options, string[]] {
  const program = new Command();

  program
    .version('0.0.1', '-v, --version')
    .usage('[-h] [-i] [-d] [-l] [-n] [-p <paths...>] [--reallyDelete] <dir...>')
    .argument('<dir...>', 'directories to look for duplicates in')
    .option(
      '-p, --paths <paths...>',
      'Non-interactively delete duplicates in the given directories. To actually delete files, also provide --reallyDelete, otherwise file-dedup will only display which files would have been deleted. File-dedup will never delete of unique files and the last remaining instances of duplicate files.',
      []
    )
    .option(
      '-i, --interactive',
      'Interactively prompt to delete files. To actually delete files, also provide --reallDelete, otherwise file-dedup will only display files that would have been deleted. File-dedup has safeguards to prevent the deletion of a unique files and the last remaining instances of duplicate files.',
      false
    )
    .option(
      '-d, --dotFiles',
      'By default, files and directories whose names begin with "." are ignored. Use this option to override this behavior.',
      false
    )
    .option(
      '-l, --followSymlinks',
      'By default, symlinks are ignored while traversing directories. Use this option to override this behavior.',
      false
    )
    .option(
      '--reallyDelete',
      'Really delete files. Unless this option is provided, file-dedup will not delete any files, but only display which files would have been deleted.',
      false
    )
    .option(
      '-n, --nodeHashing',
      "To find duplicate files, this program calculates the SHA256 hash digest of each file. If you specify --nodeHashing, this program will calculate the hash using node's built-in crypto library instead of using the shasum command found on your system. If the shasum command cannot be found, node's crypto library will always be used. In most circumstances, it is recommended not to use this option since your system's shasum command is likely the faster implementation of the two.",
      false
    );

  program.parse(argv);

  return [program.opts(), program.args];
}
