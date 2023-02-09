// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {readDirectory} from '../read_directory';
import outputFiles from 'output-files';
import withLocalTmpDir from 'with-local-tmp-dir';
import {aPath} from '../../common/path';

describe('readDirectory()', () => {
  let resetWithLocalTmpDir: () => Promise<void>;
  beforeEach(async () => {
    resetWithLocalTmpDir = await withLocalTmpDir();
  });

  afterEach(async () => {
    await resetWithLocalTmpDir();
  });

  it('does what is expected', async () => {
    const followSymlinks = false;

    await outputFiles({
      'foo.txt': 'abc',
      'bar.txt': 'def',
    });
    const dir = aPath('.');
    // const dirCallback = (dir: Path) => {};
    // const fileCallback = (file: Path, size: number, ino: number) => {};
    const dirCallback = jest.fn();
    const fileCallback = jest.fn();
    const excludedNames: string[] = [];
    const includeDotFiles = true;
    readDirectory(
      dir,
      dirCallback,
      fileCallback,
      excludedNames,
      followSymlinks,
      includeDotFiles
    );
    expect(fileCallback).toHaveBeenCalledTimes(2);
    expect(fileCallback.mock.calls[0].slice(0, 2)).toEqual([
      aPath('bar.txt'),
      3,
    ]);
    expect(fileCallback.mock.calls[1].slice(0, 2)).toEqual([
      aPath('foo.txt'),
      3,
    ]);
    expect(dirCallback).toHaveBeenCalledTimes(0);
  });
});
