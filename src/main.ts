// Copyright (c) 2022, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {getArgv} from './interaction';
import {commandLineDedup} from './command_line_dedup';

export function main() {
  commandLineDedup(getArgv());
}
