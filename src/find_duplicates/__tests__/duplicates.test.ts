// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {getFindDuplicatesStream} from '../duplicates';
import {outputOfDuplexStreamWithInput} from '../../__tests__/test_utilities';

describe('getFindDuplicatesStream()', () => {
  it('turns input into expected output', async () => {
    const findDuplicatesStream = getFindDuplicatesStream();
    const streamInput = [
      ['a', '100'],
      ['b', '100'],
      ['c', '101'],
      ['d', '100'],
      ['e', '101'],
      ['f', '100'],
      ['g', '101'],
      ['h', '102'],
      ['i', '103'],
      ['j', '104'],
      ['k', '101'],
      ['l', '100'],
      ['m', '100'],
    ];

    const streamOutput = await outputOfDuplexStreamWithInput(
      findDuplicatesStream,
      streamInput
    );
    const expected = [
      ['a', 'b', 'd', 'f', 'l', 'm'],
      ['c', 'e', 'g', 'k'],
    ];
    expect(streamOutput).toEqual(expected);
  });

  // For the sake of complete code coverage, I provide this test
  it('deals properly with double timeouts', async () => {
    const findDuplicatesStream = getFindDuplicatesStream();
    const streamInput = [
      ['a', '100'],
      ['b', '100'],
      ['c', '101'],
      ['d', '100'],
      ['e', '101'],
      ['f', '100'],
      ['g', '101'],
      ['h', '102'],
      ['i', '103'],
      ['j', '104'],
      ['k', '101'],
      ['l', '100'],
      ['m', '100'],
    ];

    streamInput.forEach(datum => {
      findDuplicatesStream.write(datum);
    });

    const results: string[][] = [];
    const promise = new Promise(resolve => {
      findDuplicatesStream.on('end', () => {
        resolve(null);
      });
    });
    results.push(findDuplicatesStream.read());
    results.push(findDuplicatesStream.read());
    // wait a little for the clearInterval() call to be tested
    // and then calle stream.end()
    setTimeout(() => {
      findDuplicatesStream.end();
      setTimeout(() => {
        // A final read() to trigger the emitting of the "end" event
        results.push(findDuplicatesStream.read());
      }, 10);
    }, 300);
    await promise;

    const expected = [
      ['a', 'b', 'd', 'f', 'l', 'm'],
      ['c', 'e', 'g', 'k'],
      null,
    ];
    expect(results).toEqual(expected);
  });
});
