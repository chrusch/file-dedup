// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {Readable} from 'node:stream';
import {outputOfReadableStream} from './test_utilities/index';

describe('outputOfReadableStream()', () => {
  it('returns a promise that is rejected when the stream has an error', async () => {
    const stream = new Readable({
      read() {
        throw new Error('there was an error in the stream');
      },
    });
    const got = outputOfReadableStream(stream);
    const expectedError =
      'error caught in stream in outputOfReadableStream: there was an error in the stream';
    return expect(got).rejects.toMatch(expectedError);
  });
});
