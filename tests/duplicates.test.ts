// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {getDuplicates} from '../src/duplicates';
import {Path} from '../src/path';
jest.mock('fs');

describe('getDuplicates()', () => {
  it('given data that maps file paths with their SHA sums, groups duplicate files together and ignores unique files', () => {
    const allData: [Path, string][] = [
      [{path: '/tmp/foo1'}, 'abcd'],
      [{path: '/tmp/foo2'}, 'bcde'],
      [{path: '/tmp/foo3'}, 'abcd'],
      [{path: '/tmp/foo4'}, 'cdef'],
      [{path: '/tmp/foo5'}, 'bcde'],
      [{path: '/tmp/foo6'}, 'bcde'],
    ];
    const got = getDuplicates(allData);
    const expected = [
      [{path: '/tmp/foo1'}, {path: '/tmp/foo3'}],
      [{path: '/tmp/foo2'}, {path: '/tmp/foo5'}, {path: '/tmp/foo6'}],
    ];
    expect(got).toEqual(expected);
  });
});
