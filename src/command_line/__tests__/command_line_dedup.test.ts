// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {getDedupOptionsFromCommandLine} from '../command_line_dedup';
import withLocalTmpDir from 'with-local-tmp-dir';
import outputFiles from 'output-files';

describe('commandLineDedup()', () => {
  let resetWithLocalTmpDir: () => Promise<void>;

  beforeEach(async () => {
    resetWithLocalTmpDir = await withLocalTmpDir();
    await outputFiles({
      tmp: {
        a: {
          x: '123456',
        },
        b: {
          x: 'foo content',
        },
        c: {
          x: '123456789',
        },
        d: {
          x: '123456789',
        },
      },
    });
  });

  afterEach(async () => {
    await resetWithLocalTmpDir();
  });

  it('when called in the simplest way, calls dedup with the expected arguments', async () => {
    const argv: string[] = ['node', 'index.js', 'tmp'];
    const got = getDedupOptionsFromCommandLine(argv);

    const expected = {
      dirsToPossiblyDeleteFrom: [],
      exclude: ['node_modules', '.git'],
      followSymlinks: false,
      includeDotfiles: false,
      interactiveDeletion: false,
      nodeHashing: false,
      pathsToTraverse: ['tmp'],
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
      'tmp/a',
      'tmp/b',
      '--',
      'tmp/c',
      'tmp/d',
    ];
    const got = getDedupOptionsFromCommandLine(argv);

    const expected = {
      dirsToPossiblyDeleteFrom: ['tmp/a', 'tmp/b'],
      exclude: ['node_modules', '.git'],
      followSymlinks: false,
      includeDotfiles: true,
      interactiveDeletion: true,
      nodeHashing: false,
      pathsToTraverse: ['tmp/c', 'tmp/d'],
      reallyDelete: true,
    };
    expect(got).toEqual(expected);
  });
});
