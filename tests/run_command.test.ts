// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {
  execHandler,
  runCommand,
  ExecHandlerFunction,
  StdoutHandlerFunction,
} from '../src/run_command';
import child_process from 'child_process';
jest.mock('child_process');

type ExecFileType = (
  command: string,
  args: string[],
  options: object,
  execHandler: ExecHandlerFunction
) => void;

describe('runCommand()', () => {
  it('when called, runs execFile with the expected arguments', async () => {
    const command = '/bin/echo';
    const args = ['foo', 'bar'];
    const stdoutHandler = (stdout: string) => {
      expect(stdout.length).toEqual(8);
      expect(stdout).toEqual('foo baz\n');
      return 'something returned';
    };

    const myExecFile: ExecFileType = (cmd, args2, options, execHandler) => {
      expect(cmd).toEqual(command);
      expect(args2).toEqual(args);
      expect(options).toEqual({});
      expect(execHandler(null, 'foo baz\n', '')).toBeUndefined();
    };

    (
      child_process.execFile as unknown as {
        mockImplementation: (execFile: ExecFileType) => void;
      }
    ).mockImplementation(myExecFile);

    const got = await runCommand(command, args, stdoutHandler);
    expect(got).toEqual('something returned');
  });
});

describe('execHandler()', () => {
  it('when given a stderr string, throws the expected error', () => {
    const stdoutHandler: StdoutHandlerFunction<never> = () => {
      fail('should not be in stdoutHandler');
    };
    const resolve = (value: string) => value;
    const got: ExecHandlerFunction = execHandler(stdoutHandler, resolve);
    expect(typeof got).toEqual('function');
    const error = null;
    const stdout = 'this is stdout';
    const stderr = 'this is stderr';
    expect(() => got(error, stdout, stderr)).toThrowError(
      'unexpected stderr running command: this is stderr'
    );
  });

  it('when given an error, throws the expected error', () => {
    const stdoutHandler: StdoutHandlerFunction<never> = () => {
      fail('should not be in stdoutHandler');
    };
    const resolve = (value: string) => value;
    const got: ExecHandlerFunction = execHandler(stdoutHandler, resolve);
    expect(typeof got).toEqual('function');
    const error = new Error('exec error');
    const stdout = 'this is stdout';
    const stderr = 'this is stderr';
    expect(() => got(error, stdout, stderr)).toThrowError(
      'unexpected error running command: exec error'
    );
  });
});
