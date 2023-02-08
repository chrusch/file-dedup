// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {setArgv} from '../command_line/argv';
import {getDedupOptionsFromCommandLine} from '../command_line/command_line_dedup';
import {main} from '../main';
import {dedup} from '../dedup';

jest.mock('../command_line/command_line_dedup.ts');
jest.mock('../dedup.ts');
describe('main()', () => {
  it('calls commandLineDedup with the argv', async () => {
    const myArgv = ['a', 'b'];
    setArgv(myArgv);
    const got = await main();
    const expected = undefined;
    expect(got).toEqual(expected);
    expect(getDedupOptionsFromCommandLine).toHaveBeenCalledWith(myArgv);
    expect(getDedupOptionsFromCommandLine).toHaveBeenCalledTimes(1);
    expect(dedup).toHaveBeenCalledTimes(1);
    // maybe verify that dedup can be called with something other than undefined
    expect(dedup).toHaveBeenCalledWith(undefined);
  });
});
