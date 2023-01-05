// Copyright (c) 2022, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {runCommand} from './run_command';
import {hashExtractor} from './hash_extractor';

export type HashDatum = [string, string];

export async function hashFile(
  file: string
): Promise<HashDatum> {
  return await runCommand<HashDatum>(
    'shasum',
    ['-a', '256', file],
    stdout => [file, hashExtractor(stdout)]
  );
}
