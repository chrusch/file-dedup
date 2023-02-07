// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {aPath} from '../src/path';

describe('Path', () => {
  describe('constructor()', () => {
    it('does what is expected', () => {
      const filePath = '/a/b/c';
      const got = aPath(filePath);
      const expected = filePath;
      expect(got).toEqual(expected);
    });
  });
});
