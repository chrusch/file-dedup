// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {getDedupOptionsFromCommandLine} from '../command_line_dedup';

jest.mock('fs');
describe('commandLineDedup()', () => {
  const MOCK_FILE_INFO = {
    '/tmp': [1001, 256],
    '/tmp/a': [1012, 32],
    '/tmp/b': [1013, 32],
    '/tmp/c': [1014, 32],
    '/tmp/d': [1015, 32],
    '/tmp/a/x': [1016, 32],
    '/tmp/b/x': [1017, 32],
    '/tmp/c/x': [1018, 32],
    '/tmp/d/x': [1019, 32],
  };

  beforeEach(() => {
    require('fs').__setMockFiles(MOCK_FILE_INFO);
  });

  it('when called in the simplest way, calls dedup with the expected arguments', async () => {
    const argv: string[] = ['node', 'index.js', '/tmp'];
    const got = getDedupOptionsFromCommandLine(argv);

    const expected = {
      dirsToPossiblyDeleteFrom: [],
      exclude: ['node_modules', '.git'],
      followSymlinks: false,
      includeDotfiles: false,
      interactiveDeletion: false,
      nodeHashing: false,
      pathsToTraverse: ['/tmp'],
      reallyDelete: false,
    };
    expect(got).toEqual(expected);
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
    const got = getDedupOptionsFromCommandLine(argv);

    const expected = {
      dirsToPossiblyDeleteFrom: ['/tmp/a', '/tmp/b'],
      exclude: ['node_modules', '.git'],
      followSymlinks: false,
      includeDotfiles: true,
      interactiveDeletion: true,
      nodeHashing: false,
      pathsToTraverse: ['/tmp/c', '/tmp/d'],
      reallyDelete: true,
    };
    expect(got).toEqual(expected);
  });
});
