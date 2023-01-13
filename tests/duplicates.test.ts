// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {getDuplicates} from '../src/duplicates';

describe('getDuplicates()', () => {
  it('given data that maps file paths with their SHA sums, groups duplicate files together and ignores unique files', () => {
    const allData: [string, string][] = [
      ['/tmp/foo1', 'abcd'],
      ['/tmp/foo2', 'bcde'],
      ['/tmp/foo3', 'abcd'],
      ['/tmp/foo4', 'cdef'],
      ['/tmp/foo5', 'bcde'],
      ['/tmp/foo6', 'bcde'],
    ];
    const got = getDuplicates(allData);
    const expected = [
      ['/tmp/foo1', '/tmp/foo3'],
      ['/tmp/foo2', '/tmp/foo5', '/tmp/foo6'],
    ];
    expect(got).toEqual(expected);
  });
});
