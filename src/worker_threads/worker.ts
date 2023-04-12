// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import workerpool from 'workerpool';
import {getSHA256HashDigest} from '../node_hash_file/hash_file';
import {HashDatum} from '../hash_file/hash_files';
import {aPath} from '../common/path';

/**
 * Uses node library to calculate the hash digest of a file.
 *
 * @param filePath - The path to the file.
 * @returns A Promise resolving to the the filePath and corresponding hash digest
 */
async function nodeHashDigest(filePath: string): Promise<HashDatum> {
  const hashDigest = await getSHA256HashDigest(filePath);
  return [aPath(filePath), hashDigest];
}

workerpool.worker({nodeHashDigest});
