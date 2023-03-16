// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import workerpool from 'workerpool';
import {getSHA256HashDigest} from '../node_hash_file/hash_file';

async function nodeHashDigest(filePath: string) {
  const hashDigest = await getSHA256HashDigest(filePath);
  return [filePath, hashDigest];
}

workerpool.worker({nodeHashDigest});
