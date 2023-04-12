// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {filesWithNonUniqueSizesStream} from '../directories';
import {silenceOutput} from '../../handle_duplicates/display';
import {aPath, Path} from '../../common/path';
import {outputOfDuplexStreamWithInput} from '../../__tests__/test_utilities';

describe('filesWithNonUniqueSizesStream()', () => {
  beforeAll(() => {
    silenceOutput();
  });

  it('returns a list of files with duplicate sizes', async () => {
    silenceOutput();
    const filesWithSizes: [Path, number][] = [
      [aPath('/a1'), 3],
      [aPath('/a2'), 7],
      [aPath('/a3'), 12],
      [aPath('/a4'), 10],
      [aPath('/a5'), 12],
      [aPath('/a6'), 3],
      [aPath('/a7'), 2],
    ];
    const stream = new filesWithNonUniqueSizesStream();
    const got = await outputOfDuplexStreamWithInput(stream, filesWithSizes);
    const expected: Path[] = [
      aPath('/a1'),
      aPath('/a3'),
      aPath('/a5'),
      aPath('/a6'),
    ];
    expect(got.sort()).toEqual(expected);
  });
});
