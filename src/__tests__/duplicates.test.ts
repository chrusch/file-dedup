// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {getDuplicates} from '../duplicates';
import {aPath, Path} from '../path';
jest.mock('fs');

describe('getDuplicates()', () => {
  it('given data that maps file paths with their SHA sums, groups duplicate files together and ignores unique files', () => {
    const allData: [Path, string][] = [
      [aPath('/tmp/foo1'), 'abcd'],
      [aPath('/tmp/foo2'), 'bcde'],
      [aPath('/tmp/foo3'), 'abcd'],
      [aPath('/tmp/foo4'), 'cdef'],
      [aPath('/tmp/foo5'), 'bcde'],
      [aPath('/tmp/foo6'), 'bcde'],
    ];
    const got = getDuplicates(allData);
    const expected = [
      [aPath('/tmp/foo1'), aPath('/tmp/foo3')],
      [aPath('/tmp/foo2'), aPath('/tmp/foo5'), aPath('/tmp/foo6')],
    ];
    expect(got).toEqual(expected);
  });
});
