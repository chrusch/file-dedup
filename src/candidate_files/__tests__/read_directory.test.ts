// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {getFileStatus, readDirectory} from '../read_directory';
import {aPath, Path} from '../../common/path';
import withLocalTmpDir from 'with-local-tmp-dir';
import outputFiles from 'output-files';
import fs, {Stats} from 'fs';

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

describe('getFileStatus()', () => {
  let resetWithLocalTmpDir: () => Promise<void>;
  beforeEach(async () => {
    resetWithLocalTmpDir = await withLocalTmpDir();
  });

  afterEach(async () => {
    await resetWithLocalTmpDir();
  });

  it('Returns the Stats of a regular file when folowSymlinks is false', async () => {
    const followSymlinks = false;

    await outputFiles({
      'foo.txt': 'abc',
    });
    const path = aPath('./foo.txt');
    const stats: Stats = getFileStatus(path, followSymlinks);

    const statKeys = [
      'dev',
      'mode',
      'nlink',
      'uid',
      'gid',
      'rdev',
      'blksize',
      'ino',
      'size',
      'blocks',
      'atimeMs',
      'mtimeMs',
      'ctimeMs',
      'birthtimeMs',
      'atime',
      'mtime',
      'ctime',
      'birthtime',
    ];

    expect(Object.keys(stats)).toEqual(statKeys);
    expect(stats.isFile()).toEqual(true);
    expect(stats.isSymbolicLink()).toEqual(false);
    expect(stats.isDirectory()).toEqual(false);
  });

  it('Returns the Stats of a regular file when followSymlinks is true', async () => {
    const followSymlinks = true;

    await outputFiles({
      'foo.txt': 'abc',
    });
    const path = aPath('./foo.txt');
    const stats: Stats = getFileStatus(path, followSymlinks);

    const statKeys = [
      'dev',
      'mode',
      'nlink',
      'uid',
      'gid',
      'rdev',
      'blksize',
      'ino',
      'size',
      'blocks',
      'atimeMs',
      'mtimeMs',
      'ctimeMs',
      'birthtimeMs',
      'atime',
      'mtime',
      'ctime',
      'birthtime',
    ];

    expect(Object.keys(stats)).toEqual(statKeys);
    expect(stats.isFile()).toEqual(true);
    expect(stats.isSymbolicLink()).toEqual(false);
    expect(stats.isDirectory()).toEqual(false);
  });

  it('Returns the Stats of a directory when followSymlinks is false', async () => {
    const followSymlinks = false;

    await outputFiles({
      'foo.txt': 'abc',
      adir: {
        'bar.txt': 'dec',
      },
    });
    const path = aPath('./adir');
    const stats: Stats = getFileStatus(path, followSymlinks);

    expect(stats.isFile()).toEqual(false);
    expect(stats.isSymbolicLink()).toEqual(false);
    expect(stats.isDirectory()).toEqual(true);
  });

  it('Returns the Stats of a directory when followSymlinks is true', async () => {
    const followSymlinks = true;

    await outputFiles({
      'foo.txt': 'abc',
      adir: {
        'bar.txt': 'dec',
      },
    });
    const path = aPath('./adir');
    const stats: Stats = getFileStatus(path, followSymlinks);

    expect(stats.isFile()).toEqual(false);
    expect(stats.isSymbolicLink()).toEqual(false);
    expect(stats.isDirectory()).toEqual(true);
  });

  it('Returns the Stats of a link when followSymlinks is false', async () => {
    const followSymlinks = false;

    await outputFiles({
      'foo.txt': 'abc',
      adir: {
        'bar.txt': 'dec',
      },
    });
    fs.symlinkSync('foo.txt', 'foo-symlink.txt');
    const path = aPath('./foo-symlink.txt');
    const stats: Stats = getFileStatus(path, followSymlinks);

    expect(stats.isSymbolicLink()).toEqual(true);
    expect(stats.isFile()).toEqual(false);
    expect(stats.isDirectory()).toEqual(false);
  });

  it('Returns the Stats of a linked file when followSymlinks is true', async () => {
    const followSymlinks = true;

    await outputFiles({
      'foo.txt': 'abc',
      adir: {
        'bar.txt': 'dec',
      },
    });
    fs.symlinkSync('foo.txt', 'foo-symlink.txt');
    const path = aPath('./foo-symlink.txt');
    const stats: Stats = getFileStatus(path, followSymlinks);

    expect(stats.isSymbolicLink()).toEqual(false);
    expect(stats.isFile()).toEqual(true);
    expect(stats.isDirectory()).toEqual(false);
  });

  it('Returns the Stats of a triply linked file when followSymlinks is true', async () => {
    const followSymlinks = true;

    await outputFiles({
      'foo.txt': 'abc',
      'zoo.txt': 'abcd',
      adir: {
        'bar.txt': 'dec',
      },
    });
    fs.symlinkSync('foo.txt', 'foo-symlink1.txt');
    fs.symlinkSync('foo-symlink1.txt', 'foo-symlink2.txt');
    fs.symlinkSync('foo-symlink2.txt', 'foo-symlink3.txt');

    const patho = aPath('./foo.txt');
    const path1 = aPath('./foo-symlink1.txt');
    const path2 = aPath('./foo-symlink2.txt');
    const path3 = aPath('./foo-symlink3.txt');

    const pathz = aPath('./zoo.txt');

    const stats1: Stats = getFileStatus(path1, followSymlinks);
    const stats2: Stats = getFileStatus(path2, followSymlinks);
    const stats3: Stats = getFileStatus(path3, followSymlinks);
    const statso: Stats = getFileStatus(patho, followSymlinks);
    const statsz: Stats = getFileStatus(pathz, followSymlinks);

    expect(statso.isFile()).toEqual(true);
    expect(stats1.isFile()).toEqual(true);
    expect(stats2.isFile()).toEqual(true);
    expect(stats3.isFile()).toEqual(true);

    expect(statso.isSymbolicLink()).toEqual(false);
    expect(stats1.isSymbolicLink()).toEqual(false);
    expect(stats2.isSymbolicLink()).toEqual(false);
    expect(stats3.isSymbolicLink()).toEqual(false);

    expect(stats3.isDirectory()).toEqual(false);
    expect(stats2.isDirectory()).toEqual(false);
    expect(stats1.isDirectory()).toEqual(false);
    expect(statso.isDirectory()).toEqual(false);

    const ino = statso.ino;
    expect(stats1.ino).toEqual(ino);
    expect(stats2.ino).toEqual(ino);
    expect(stats3.ino).toEqual(ino);
    expect(statsz.ino).not.toEqual(ino);
  });

  it('Returns the Stats of a linked dir when followSymlinks is true', async () => {
    const followSymlinks = true;

    await outputFiles({
      'foo.txt': 'abc',
      adir: {
        'bar.txt': 'dec',
      },
    });
    fs.symlinkSync('adir', 'adir-symlink');
    const path = aPath('./adir-symlink');
    const stats: Stats = getFileStatus(path, followSymlinks);

    expect(stats.isSymbolicLink()).toEqual(false);
    expect(stats.isFile()).toEqual(false);
    expect(stats.isDirectory()).toEqual(true);
  });

  it('Returns the Stats of a triply linked dir when followSymlinks is true', async () => {
    const followSymlinks = true;

    await outputFiles({
      'foo.txt': 'abc',
      adir: {
        'bar.txt': 'dec',
      },
      anotherdir: {
        'zar.txt': 'efg',
      },
    });
    fs.symlinkSync('adir', 'adir-symlink1');
    fs.symlinkSync('adir-symlink1', 'adir-symlink2');
    fs.symlinkSync('adir-symlink2', 'adir-symlink3');

    const patho = aPath('./adir');
    const path1 = aPath('./adir-symlink1');
    const path2 = aPath('./adir-symlink2');
    const path3 = aPath('./adir-symlink3');

    const pathz = aPath('./anotherdir');

    const stats1: Stats = getFileStatus(path1, followSymlinks);
    const stats2: Stats = getFileStatus(path2, followSymlinks);
    const stats3: Stats = getFileStatus(path3, followSymlinks);
    const statso: Stats = getFileStatus(patho, followSymlinks);
    const statsz: Stats = getFileStatus(pathz, followSymlinks);

    expect(statso.isFile()).toEqual(false);
    expect(stats1.isFile()).toEqual(false);
    expect(stats2.isFile()).toEqual(false);
    expect(stats3.isFile()).toEqual(false);

    expect(statso.isSymbolicLink()).toEqual(false);
    expect(stats1.isSymbolicLink()).toEqual(false);
    expect(stats2.isSymbolicLink()).toEqual(false);
    expect(stats3.isSymbolicLink()).toEqual(false);

    expect(stats3.isDirectory()).toEqual(true);
    expect(stats2.isDirectory()).toEqual(true);
    expect(stats1.isDirectory()).toEqual(true);
    expect(statso.isDirectory()).toEqual(true);

    const ino = statso.ino;
    expect(stats1.ino).toEqual(ino);
    expect(stats2.ino).toEqual(ino);
    expect(stats3.ino).toEqual(ino);
    expect(statsz.ino).not.toEqual(ino);
  });
});
