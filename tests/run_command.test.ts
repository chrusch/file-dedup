// Copyright (c) 2022, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {runCommand} from '../src/run_command';

describe('runCommand()', () => {
  it('does what is expected', done => {
    jest.setTimeout(60000);
    const command = '/bin/echo';
    const args = ['foo', 'bar'];
    const stdoutHandler = (stdout: string): void => {
      expect(stdout.length).toEqual(8);
      expect(stdout).toEqual('foo bar\n');
      done();
    };
    runCommand(command, args, stdoutHandler);
  });
});
