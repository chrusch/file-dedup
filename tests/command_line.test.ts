// Copyright (c) 2022, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {commandLineOptions, Options} from '../src/command_line';

describe('commandLineOptions(argv)', () => {
  const nodeExecutable = '/path/to/node';
  const jsFile = '/path/to/jsFile';

  it('simplest possible functional command line returns default options', () => {
    const argv: string[] = [nodeExecutable, jsFile, '/tmp'];
    const got = commandLineOptions(argv);
    const options: Options = {
      dotFiles: false,
      interactive: false,
      paths: [],
      reallyDelete: false,
    };
    const args: string[] = ['/tmp'];
    const expected = [options, args];
    expect(got).toEqual(expected);
  });

  it('complicated command line with option short forms returns corresponding options object', () => {
    const argv: string[] = [
      nodeExecutable,
      jsFile,
      '-d',
      '-i',
      '-p',
      '/baz/bar',
      '--reallyDelete',
      '/tmp',
      '/foo/bar',
      '/baz',
    ];
    const got = commandLineOptions(argv);
    const options: Options = {
      dotFiles: true,
      interactive: true,
      paths: ['/baz/bar'],
      reallyDelete: true,
    };
    const args: string[] = ['/tmp', '/foo/bar', '/baz'];
    const expected = [options, args];
    expect(got).toEqual(expected);
  });

  it('allows for multiple paths', () => {
    const argv: string[] = [
      nodeExecutable,
      jsFile,
      '-p',
      '/baza/bara',
      '/bazb/barb',
      '--reallyDelete',
      '/tmp',
    ];
    const got = commandLineOptions(argv);
    const options: Options = {
      dotFiles: false,
      interactive: false,
      paths: ['/baza/bara', '/bazb/barb'],
      reallyDelete: true,
    };
    const args: string[] = ['/tmp'];
    const expected = [options, args];
    expect(got).toEqual(expected);
  });

  it('complicated command line with option long forms returns corresponding options object', () => {
    const argv: string[] = [
      nodeExecutable,
      jsFile,
      '--dotFiles',
      '--interactive',
      '--paths',
      '/baza/bara',
      '--reallyDelete',
      '/tmpa',
      '/fooa/bara',
      '/baza',
    ];
    const got = commandLineOptions(argv);
    const options: Options = {
      dotFiles: true,
      interactive: true,
      paths: ['/baza/bara'],
      reallyDelete: true,
    };
    const args: string[] = ['/tmpa', '/fooa/bara', '/baza'];
    const expected = [options, args];
    expect(got).toEqual(expected);
  });
});
