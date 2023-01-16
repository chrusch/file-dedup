// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {onePathPerInode} from '../src/one_path_per_inode';
import {Path} from '../src/path';

describe('onePathPerInode()', () => {
  it('removes duplicate paths so that there is only one path per inode', () => {
    const filesWithSizesAndInodes: [Path, number, number][] = [
      [Path.create('/aa'), 256, 7000001],
      [Path.create('/ab'), 256, 7000002],
      [Path.create('/ac'), 256, 7000003],
      [Path.create('/ad'), 256, 7000004],
      [Path.create('/ae'), 256, 7000003],
      [Path.create('/af'), 256, 7000005],
      [Path.create('/ag'), 256, 7000003],
      [Path.create('/ah'), 256, 7000002],
      [Path.create('/ai'), 256, 7000006],
    ];
    const got = onePathPerInode(filesWithSizesAndInodes);
    const expected = [
      [Path.create('/aa'), 256],
      [Path.create('/ah'), 256],
      [Path.create('/ag'), 256],
      [Path.create('/ad'), 256],
      [Path.create('/af'), 256],
      [Path.create('/ai'), 256],
    ];
    expect(got).toEqual(expected);
  });
});
