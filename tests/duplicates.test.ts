// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {getDuplicates} from '../src/duplicates';
import {Path} from '../src/path';

describe('getDuplicates()', () => {
  it('given data that maps file paths with their SHA sums, groups duplicate files together and ignores unique files', () => {
    const allData: [Path, string][] = [
      [Path.create('/tmp/foo1'), 'abcd'],
      [Path.create('/tmp/foo2'), 'bcde'],
      [Path.create('/tmp/foo3'), 'abcd'],
      [Path.create('/tmp/foo4'), 'cdef'],
      [Path.create('/tmp/foo5'), 'bcde'],
      [Path.create('/tmp/foo6'), 'bcde'],
    ];
    const got = getDuplicates(allData);
    const expected = [
      Path.createMulti('/tmp/foo1', '/tmp/foo3'),
      Path.createMulti('/tmp/foo2', '/tmp/foo5', '/tmp/foo6'),
    ];
    expect(got).toEqual(expected);
  });
});
