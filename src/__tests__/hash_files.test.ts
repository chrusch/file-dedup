// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {hashFile} from '../hash_files';
import * as runCommand from '../run_command';
/* eslint-disable-next-line node/no-unpublished-import */
import {jest} from '@jest/globals'; // needed for jest.Mocked to work
import {aPath} from '../path';

jest.mock('../run_command.ts');
jest.mock('fs');
describe('hashFile()', () => {
  it('when called, calls runCommand with expected arguments', async () => {
    const file = aPath('/tmp/foo');
    const got = await hashFile(file);
    const expected = undefined;
    expect(got).toEqual(expected);
    expect(runCommand.runCommand).toHaveBeenCalledTimes(1);
    expect(runCommand.runCommand).toHaveReturnedTimes(1);
    type RC = jest.Mocked<typeof runCommand.runCommand>;
    const call = (runCommand.runCommand as unknown as RC).mock.calls[0];
    expect(call[0]).toEqual('shasum');
    expect(call[1]).toEqual(['-a', '256', file]);
    expect(typeof call[2]).toEqual('function');
    expect(call[2]('abcd /tmp/cc')).toEqual([file, 'abcd']);
  });
});
