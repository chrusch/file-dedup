// Copyright (c) 2022, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {commandOutputHandler, hashFile} from '../src/hash_files';
import {OnJobCompleteCallBack} from '../src/work_queue';
import {HashData} from '../src/dedup';
import * as runCommand from '../src/run_command';
import {jest} from '@jest/globals'; // needed for jest.Mocked to work

jest.mock('../src/run_command.ts');
describe('hashFile()', () => {
  it('does what is expected', () => {
    const file = '/tmp/foo';
    const onTaskCompleteCallBack: OnJobCompleteCallBack = jest.fn(() => {});
    const hashData: HashData = [];
    const got = hashFile(file, onTaskCompleteCallBack, hashData);
    const expected = undefined;
    expect(got).toEqual(expected);
    expect(onTaskCompleteCallBack).toHaveBeenCalledTimes(0);
    expect(runCommand.runCommand).toHaveBeenCalledTimes(1);
    expect(runCommand.runCommand).toHaveReturnedTimes(1);
    type RC = jest.Mocked<typeof runCommand.runCommand>;
    const call = (runCommand.runCommand as unknown as RC).mock.calls[0];
    expect(call[0]).toEqual('shasum');
    expect(call[1]).toEqual(['-a', '256', file]);
    expect(typeof call[2]).toEqual('function');
  });
});

describe('commandOutputHandler()', () => {
  it('does what is expected', () => {
    const file = '/tmp/foo';
    const onTaskCompleteCallBack: OnJobCompleteCallBack = jest.fn(() => {});
    const hashData: HashData = [];
    // got is also a generated function
    const got = commandOutputHandler(file, onTaskCompleteCallBack, hashData);
    expect(onTaskCompleteCallBack).toHaveBeenCalledTimes(0);
    const stdout = '22ddbca88c file.txt';
    const got2 = got(stdout);
    expect(onTaskCompleteCallBack).toHaveBeenCalledTimes(1);
    expect(got2).toEqual(undefined);
    expect(hashData).toEqual([[file, '22ddbca88c']]);
  });
});
