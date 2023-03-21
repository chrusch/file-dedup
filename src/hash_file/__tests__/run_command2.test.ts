// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {runCommand} from '../run_command';

jest.setTimeout(40000);
describe('runCommand()', () => {
  it('can be run 925 times without error', async () => {
    const command = '/usr/bin/shasum';
    const args = ['-a', '256', '/tmp/foo'];
    const stdoutHandler = (stdout: string) => {
      expect(stdout).toEqual(
        'd69f48be310685305d26044b9bdcd0df6850ed45d49d3bacf4fb09f88dac8761  /tmp/foo\n'
      );
      return 'something returned';
    };

    // const myExecFile: ExecFileType = (cmd, args2, options, execHandler) => {
    //   expect(cmd).toEqual(command);
    //   expect(args2).toEqual(args);
    //   expect(options).toEqual({});
    //   expect(execHandler(null, 'foo baz\n', '')).toBeUndefined();
    // };

    // (
    //   child_process.execFile as unknown as {
    //     mockImplementation: (execFile: ExecFileType) => void;
    //   }
    // ).mockImplementation(myExecFile);

    for (let i = 0; i < 2000; i++) {
      const got = await runCommand(command, args, stdoutHandler);
      expect(got).toEqual('something returned');
    }
  });
});
