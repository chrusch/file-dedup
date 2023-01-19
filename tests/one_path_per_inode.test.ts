// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {onePathPerInode} from '../src/one_path_per_inode';
import {Path} from '../src/path';

jest.mock('fs');

describe('onePathPerInode()', () => {
  it('removes duplicate paths so that there is only one path per inode', () => {
    const filesWithSizesAndInodes: [Path, number, number][] = [
      [{path: '/aa'}, 256, 7000001],
      [{path: '/ab'}, 256, 7000002],
      [{path: '/ac'}, 256, 7000003],
      [{path: '/ad'}, 256, 7000004],
      [{path: '/ae'}, 256, 7000003],
      [{path: '/af'}, 256, 7000005],
      [{path: '/ag'}, 256, 7000003],
      [{path: '/ah'}, 256, 7000002],
      [{path: '/ai'}, 256, 7000006],
    ];
    const got = onePathPerInode(filesWithSizesAndInodes);
    const expected = [
      [{path: '/aa'}, 256],
      [{path: '/ah'}, 256],
      [{path: '/ag'}, 256],
      [{path: '/ad'}, 256],
      [{path: '/af'}, 256],
      [{path: '/ai'}, 256],
    ];
    expect(got).toEqual(expected);
  });
});
