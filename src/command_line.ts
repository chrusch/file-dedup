// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {Command} from 'commander';

// How this program runs depends on the options given on the command line.
// Here is where those options are defined.
export interface Options {
  interactive: boolean;
  dotFiles: boolean;
  paths: readonly string[];
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
    .usage('[-h] [-i] [-d] [-p <paths...>] [--reallyDelete] <dir...>')
    .argument('<dir...>', 'directories to look for duplicates in')
    .option(
      '-p, --paths <paths...>',
      'Non-interactively delete duplicates in the given directories. To actually delete files, also provide --reallyDelete, otherwise the program will only display which files would have been deleted. This program will never delete every instance of a duplicate file.',
      []
    )
    .option(
      '-i, --interactive',
      'Interactively prompt to delete files. To actually delete files, also provide --reallyDelete, otherwise will only display files that would have been deleted. This program will never delete every instance of a duplicate file.',
      false
    )
    .option(
      '-d, --dotFiles',
      'By default, files and directories whose names begin with "." are ignored. Use this option to override this behavior.',
      false
    )
    .option(
      '--reallyDelete',
      'Really delete files. By default this command displays which files would be deleted, but does not actually delete files. Use this option to actually delete files.',
      false
    );

  program.parse(argv);

  return [program.opts(), program.args];
}
