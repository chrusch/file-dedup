// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {runCommand} from './run_command';
import {hashExtractor} from './hash_extractor';
import {Path} from './path';

export type HashDatum = [Path, string];

export async function hashFile(file: Path): Promise<HashDatum> {
  return await runCommand<HashDatum>(
    'shasum',
    ['-a', '256', file.pathString],
    stdout => [file, hashExtractor(stdout)]
  );
}
