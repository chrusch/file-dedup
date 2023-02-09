// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {readDirectory} from '../read_directory';
import {aPath, Path} from '../../common/path';
import withLocalTmpDir from 'with-local-tmp-dir';
import outputFiles from 'output-files';

describe('readDirectory()', () => {
  let resetWithLocalTmpDir: () => Promise<void>;

  beforeEach(async () => {
    resetWithLocalTmpDir = await withLocalTmpDir();
    await outputFiles({
      tmp: {
        git: {
          '.git': {
            foo: 'foo content',
            bar: 'bar content',
          },
        },
        project: {
          foo2: 'foo project content',
          bar2: '123456789',
        },
        anotherproject: {
          '.config': '123456',
          '.foo': '12345',
        },
      },
    });
  });

  afterEach(async () => {
    await resetWithLocalTmpDir();
  });

  const dirCallback = (pth: Path): void => {
    throw new Error(`in dir callback: ${pth}`);
  };
  const fileCallback = (file: Path, size: number): void => {
    throw new Error(`in file callback ${file} ${size}`);
  };

  it('excludes excluded files', () => {
    const folder = aPath('tmp/project');
    const excludedNames: string[] = ['foo2', 'bar2'];
    const includeDotfiles = true;
    const followSymlinks = false;
    const functionCall = () =>
      readDirectory(
        folder,
        dirCallback,
        fileCallback,
        excludedNames,
        followSymlinks,
        includeDotfiles
      );
    expect(functionCall).not.toThrowError();
  });

  it('excludes dot files when configured to do so', () => {
    const folder = aPath('tmp/git');
    const excludedNames: string[] = [];
    const followSymlinks = false;
    const includeDotfiles = false;
    const functionCall = () =>
      readDirectory(
        folder,
        dirCallback,
        fileCallback,
        excludedNames,
        followSymlinks,
        includeDotfiles
      );
    expect(functionCall).not.toThrowError();
  });

  it('includes included files', () => {
    const folder = aPath('tmp/project');
    const excludedNames: string[] = ['foo2'];
    const followSymlinks = false;
    const includeDotfiles = true;
    const functionCall = () =>
      readDirectory(
        folder,
        dirCallback,
        fileCallback,
        excludedNames,
        followSymlinks,
        includeDotfiles
      );
    expect(functionCall).toThrowError('in file callback tmp/project/bar2 9');
  });

  it('includes included directories', () => {
    const folder = aPath('tmp/git');
    const excludedNames: string[] = ['foo'];
    const followSymlinks = false;
    const includeDotfiles = true;
    const functionCall = () =>
      readDirectory(
        folder,
        dirCallback,
        fileCallback,
        excludedNames,
        followSymlinks,
        includeDotfiles
      );
    expect(functionCall).toThrowError('in dir callback: tmp/git/.git');
  });

  it('excludes dotfiles when configured to do so ', () => {
    const folder = aPath('tmp/anotherproject');
    const excludedNames: string[] = [];
    const followSymlinks = false;
    const includeDotfiles = false;
    const functionCall = () =>
      readDirectory(
        folder,
        dirCallback,
        fileCallback,
        excludedNames,
        followSymlinks,
        includeDotfiles
      );
    expect(functionCall).not.toThrowError();
  });

  it('includes dotfiles when configured to do so ', () => {
    const folder = aPath('tmp/anotherproject');
    const excludedNames: string[] = [];
    const followSymlinks = false;
    const includeDotfiles = true;
    const functionCall = () =>
      readDirectory(
        folder,
        dirCallback,
        fileCallback,
        excludedNames,
        followSymlinks,
        includeDotfiles
      );
    expect(functionCall).toThrowError(
      'in file callback tmp/anotherproject/.config 6'
    );
  });
});
