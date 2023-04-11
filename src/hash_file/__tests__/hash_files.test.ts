// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {hashAllCandidateFiles} from '../hash_files';
import {Transform} from 'node:stream';

describe('hashAllCandidateFiles(nodeHashing)', () => {
  it('returns a Transform stream when nodeHashing is true', async () => {
    const nodeHashing = true;
    const got = await hashAllCandidateFiles(nodeHashing);
    expect(got instanceof Transform).toBe(true);
  });
  it('returns a Transform stream when nodeHashing is false', async () => {
    const nodeHashing = false;
    const got = await hashAllCandidateFiles(nodeHashing);
    expect(got instanceof Transform).toBe(true);
  });
});
