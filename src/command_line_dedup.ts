// Copyright (c) 2022, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import path from 'path';
import {commandLineOptions} from './command_line';
import {exclude} from './directories';
import {dedup, DedupOptions} from './dedup';

// function commandLineDedup()
//
// get options from the command line and list duplicate files or
// deduplicate files as requested through the options
export async function commandLineDedup(argv: string[]): Promise<void> {
  const [options, args] = commandLineOptions(argv);

  const interactiveDeletion = options.interactive;
  const reallyDelete = options.reallyDelete;
  const includeDotfiles = options.dotFiles;
  const paths: string[] = Array.isArray(options.paths)
    ? options.paths
    : [options.paths];
  const dirsToPossiblyDeleteFrom: string[] = paths.map(p => path.normalize(p));
  const pathsToTraverse: string[] = args.map(a => path.normalize(a));

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
