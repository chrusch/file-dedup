// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {onePathPerInode} from '../../src/candidate_files/one_path_per_inode';
import {aPath, Path} from '../../src/path';

jest.mock('fs');

describe('onePathPerInode()', () => {
  it('removes duplicate paths so that there is only one path per inode', () => {
    const filesWithSizesAndInodes: [Path, number, number][] = [
      [aPath('/aa'), 256, 7000001],
      [aPath('/ab'), 256, 7000002],
      [aPath('/ac'), 256, 7000003],
      [aPath('/ad'), 256, 7000004],
      [aPath('/ae'), 256, 7000003],
      [aPath('/af'), 256, 7000005],
      [aPath('/ag'), 256, 7000003],
      [aPath('/ah'), 256, 7000002],
      [aPath('/ai'), 256, 7000006],
    ];
    const got = onePathPerInode(filesWithSizesAndInodes);
    const expected = [
      [aPath('/aa'), 256],
      [aPath('/ah'), 256],
      [aPath('/ag'), 256],
      [aPath('/ad'), 256],
      [aPath('/af'), 256],
      [aPath('/ai'), 256],
    ];
    expect(got).toEqual(expected);
  });
});
