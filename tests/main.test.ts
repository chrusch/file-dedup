// Copyright (c) 2022, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {setArgv} from '../src/interaction';
import {commandLineDedup} from '../src/command_line_dedup';
import {main} from '../src/main';

jest.mock('../src/command_line_dedup.ts');
describe('main()', () => {
  it('calls commandLineDedup with the argv', () => {
    const myArgv = ['a', 'b'];
    setArgv(myArgv);
    const got = main();
    const expected = undefined;
    expect(got).toEqual(expected);
    expect(commandLineDedup).toHaveBeenCalledWith(myArgv);
    expect(commandLineDedup).toHaveBeenCalledTimes(1);
  });
});
