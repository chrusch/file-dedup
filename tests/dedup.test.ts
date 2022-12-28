// Copyright (c) 2022, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {dedup, DedupOptions} from '../src/dedup';
import {silenceOutput} from '../src/display';

// Come back later and test this properly
describe('dedup()', () => {
  beforeAll(() => {
    silenceOutput();
  });
  it('returns a void promise', async () => {
    const options: DedupOptions = {
      dirsToPossiblyDeleteFrom: [],
      exclude: [],
      includeDotfiles: false,
      interactiveDeletion: false,
      pathsToTraverse: [],
      reallyDelete: false,
    };

    const got = await dedup(options);
    const expected = undefined;
    expect(got).toEqual(expected);
  });
});
