// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {onePathPerInode} from '../src/one_path_per_inode';

describe('onePathPerInode()', () => {
  it('removes duplicate paths so that there is only one path per inode', () => {
    const filesWithSizesAndInodes: [string, number, number][] = [
      ['aa', 256, 7000001],
      ['ab', 256, 7000002],
      ['ac', 256, 7000003],
      ['ad', 256, 7000004],
      ['ae', 256, 7000003],
      ['af', 256, 7000005],
      ['ag', 256, 7000003],
      ['ah', 256, 7000002],
      ['ai', 256, 7000006],
    ];
    const got = onePathPerInode(filesWithSizesAndInodes);
    const expected = [
      ['aa', 256],
      ['ah', 256],
      ['ag', 256],
      ['ad', 256],
      ['af', 256],
      ['ai', 256],
    ];
    expect(got).toEqual(expected);
  });
});
