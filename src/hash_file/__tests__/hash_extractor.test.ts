// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {hashExtractor} from '../hash_extractor';

describe('hashExtractor(stdout)', () => {
  it('extracts a hex hash from the begining of a string', () => {
    const stdout = 'abcdef1234567890 And then . some other, stuff!';
    const got = hashExtractor(stdout);
    const expected = 'abcdef1234567890';
    expect(got).toEqual(expected);
  });

  it('throws an error when it does not find a hash', () => {
    const stdout = 'Qabcdef1234567890 And then . some other, stuff!';
    const fn = () => hashExtractor(stdout);
    const errorMsg =
      'expected to find a hash at the beginning of the STDOUT of the shasum command, but instead found: Qabcdef1234567890 And then . some other, stuff!';
    expect(fn).toThrowError(errorMsg);
  });
});
