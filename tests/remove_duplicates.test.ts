// Copyright (c) 2022, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {fileIsInADeleteDirectory} from '../src/remove_duplicates';
import fs from 'fs';
jest.mock('fs');

describe('fileIsInADeleteDirectory()', () => {
  it('when file is in given directory, return true', () => {
    const file = '/tmp/foo';
    const dirs: string[] = ['/foo', '/tmp'];
    const got = fileIsInADeleteDirectory(file, dirs);
    const expected = true;
    expect(got).toEqual(expected);
    expect(fs.realpathSync).toHaveBeenCalledTimes(4);
    expect(fs.realpathSync).toHaveBeenNthCalledWith(1, '/tmp/foo');
    expect(fs.realpathSync).toHaveBeenNthCalledWith(2, '/foo');
    expect(fs.realpathSync).toHaveBeenNthCalledWith(3, '/tmp/foo');
    expect(fs.realpathSync).toHaveBeenNthCalledWith(4, '/tmp');
  });

  it('when file is not in given directory, return false', () => {
    const file = '/other/foo';
    const dirs: string[] = ['/foo', '/tmp'];
    const got = fileIsInADeleteDirectory(file, dirs);
    const expected = false;
    expect(got).toEqual(expected);
    expect(fs.realpathSync).toHaveBeenCalledTimes(4);
    expect(fs.realpathSync).toHaveBeenNthCalledWith(1, '/other/foo');
    expect(fs.realpathSync).toHaveBeenNthCalledWith(2, '/foo');
    expect(fs.realpathSync).toHaveBeenNthCalledWith(3, '/other/foo');
    expect(fs.realpathSync).toHaveBeenNthCalledWith(4, '/tmp');
  });

  it('when there is no dir specified, return false', () => {
    const file = '/other/foo';
    const dirs: string[] = [];
    const got = fileIsInADeleteDirectory(file, dirs);
    const expected = false;
    expect(got).toEqual(expected);
    expect(fs.realpathSync).toHaveBeenCalledTimes(0);
  });
});
