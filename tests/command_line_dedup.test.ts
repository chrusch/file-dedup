// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {commandLineDedup} from '../src/command_line_dedup';
import {dedup} from '../src/dedup';
import {Path} from '../src/path';

jest.mock('../src/dedup');
describe('commandLineDedup()', () => {
  it('when called in the simplest way, calls dedup with the expected arguments', async () => {
    const argv: string[] = ['node', 'index.js', '/tmp'];
    const got = await commandLineDedup(argv);
    const expected = undefined;
    expect(got).toEqual(expected);
    expect(dedup).toHaveBeenCalledTimes(1);

    const args = {
      dirsToPossiblyDeleteFrom: [],
      exclude: ['node_modules', '.git'],
      includeDotfiles: false,
      interactiveDeletion: false,
      pathsToTraverse: Path.createMulti('/tmp'),
      reallyDelete: false,
    };

    expect(dedup).toHaveBeenCalledWith(args);
  });

  it('when called in a more complicated way, calls dedup with the expected arguments', async () => {
    const argv: string[] = [
      'node',
      'index.js',
      '--reallyDelete',
      '--interactive',
      '--dotFiles',
      '-p',
      '/tmp/a',
      '/tmp/b',
      '--',
      '/tmp/c',
      '/tmp/d',
    ];
    const got = await commandLineDedup(argv);
    const expected = undefined;
    expect(got).toEqual(expected);
    expect(dedup).toHaveBeenCalledTimes(1);

    const args = {
      dirsToPossiblyDeleteFrom: Path.createMulti('/tmp/a', '/tmp/b'),
      exclude: ['node_modules', '.git'],
      includeDotfiles: true,
      interactiveDeletion: true,
      pathsToTraverse: Path.createMulti('/tmp/c', '/tmp/d'),
      reallyDelete: true,
    };

    expect(dedup).toHaveBeenCalledWith(args);
  });
});
