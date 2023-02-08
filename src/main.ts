// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {getArgv} from './handle_duplicates/interaction';
import {getDedupOptionsFromCommandLine} from './command_line_dedup';
import {dedup} from './dedup';

export async function main(): Promise<void> {
  const dedupOptions = getDedupOptionsFromCommandLine(getArgv());
  await dedup(dedupOptions);
}
