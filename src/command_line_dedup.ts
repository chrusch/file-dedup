// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {commandLineOptions} from './command_line';
import {exclude} from './directories';
import {dedup, DedupOptions} from './dedup';
import {verifyDirectoryPaths} from './secure_directory_path';

// function commandLineDedup()
//
// get options from the command line and list duplicate files or
// deduplicate files as requested through the options
export async function commandLineDedup(argv: readonly string[]): Promise<void> {
  const [options, args] = commandLineOptions(argv);

  const interactiveDeletion = options.interactive;
  const reallyDelete = options.reallyDelete;
  const includeDotfiles = options.dotFiles;
  const paths: readonly string[] = options.paths;
  const dirsToPossiblyDeleteFrom = verifyDirectoryPaths(...paths);
  const pathsToTraverse = verifyDirectoryPaths(...args);

  const dedupOptions: DedupOptions = {
    dirsToPossiblyDeleteFrom,
    exclude,
    includeDotfiles,
    interactiveDeletion,
    pathsToTraverse,
    reallyDelete,
  };

  await dedup(dedupOptions);
}
