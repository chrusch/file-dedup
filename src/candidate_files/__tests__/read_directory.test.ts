// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {
  createDirectoryReadingStream,
  directoryGenerator,
  filePathGenerator,
  getFileStatus,
  readDirectory,
} from '../read_directory';
import {aPath, Path} from '../../common/path';
import {forceVerificationOfDirectoryPaths} from '../../common/verified_directory_path';
import withLocalTmpDir from 'with-local-tmp-dir';
import outputFiles from 'output-files';
import fs, {Stats} from 'fs';
import {
  asyncGeneratorToArray,
  outputOfReadableStream,
} from '../../__tests__/test_utilities';

describe('getFileStatus()', () => {
  let resetWithLocalTmpDir: () => Promise<void>;
  beforeEach(async () => {
    resetWithLocalTmpDir = await withLocalTmpDir();
  });

  afterEach(async () => {
    await resetWithLocalTmpDir();
  });

  it('raises an error if the file does not exist and followSymlinks is false', async () => {
    const followSymlinks = false;
    await outputFiles({
      'foo.txt': 'abc',
    });
    const path = aPath('./bar.txt');
    const expectedErrorMessage =
      "ENOENT: no such file or directory, lstat './bar.txt'";
    expect(getFileStatus(path, followSymlinks)).rejects.toThrowError(
      expectedErrorMessage
    );
  });

  it('raises an error if the file does not exist and followSymlinks is true', async () => {
    const followSymlinks = true;
    await outputFiles({
      'foo.txt': 'abc',
    });
    const path = aPath('./bar.txt');
    const expectedErrorMessage =
      "ENOENT: no such file or directory, stat './bar.txt'";
    expect(getFileStatus(path, followSymlinks)).rejects.toThrowError(
      expectedErrorMessage
    );
  });

  it('Returns the Stats of a regular file when folowSymlinks is false', async () => {
    const followSymlinks = false;

    await outputFiles({
      'foo.txt': 'abc',
    });
    const path = aPath('./foo.txt');
    const stats: Stats = await getFileStatus(path, followSymlinks);

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
    const stats: Stats = await getFileStatus(path, followSymlinks);

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
    const stats: Stats = await getFileStatus(path, followSymlinks);

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
    const stats: Stats = await getFileStatus(path, followSymlinks);

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
    const stats: Stats = await getFileStatus(path, followSymlinks);

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
    const stats: Stats = await getFileStatus(path, followSymlinks);

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

    const stats1: Stats = await getFileStatus(path1, followSymlinks);
    const stats2: Stats = await getFileStatus(path2, followSymlinks);
    const stats3: Stats = await getFileStatus(path3, followSymlinks);
    const statso: Stats = await getFileStatus(patho, followSymlinks);
    const statsz: Stats = await getFileStatus(pathz, followSymlinks);

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
    const stats: Stats = await getFileStatus(path, followSymlinks);

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

    const stats1: Stats = await getFileStatus(path1, followSymlinks);
    const stats2: Stats = await getFileStatus(path2, followSymlinks);
    const stats3: Stats = await getFileStatus(path3, followSymlinks);
    const statso: Stats = await getFileStatus(patho, followSymlinks);
    const statsz: Stats = await getFileStatus(pathz, followSymlinks);

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

describe('directoryGenerator()', () => {
  it('returns initial values', () => {
    const initialDirectories = forceVerificationOfDirectoryPaths(
      '/a/b',
      '/c/d'
    );
    const generator = directoryGenerator(initialDirectories);
    expect(generator.next()).toEqual({done: false, value: '/a/b'});
    expect(generator.next()).toEqual({done: false, value: '/c/d'});
    expect(generator.next()).toEqual({done: true, value: undefined});
  });

  it('returns initial values and additonally provided values', () => {
    const initialDirectories = forceVerificationOfDirectoryPaths(
      '/a/b',
      '/c/d'
    );
    const generator = directoryGenerator(initialDirectories);
    expect(generator.next()).toEqual({done: false, value: '/a/b'});
    const newValues = [aPath('/e/f'), aPath('/g/h')];
    expect(generator.next(newValues)).toEqual({
      done: false,
      value: '/a/b',
    });
    expect(generator.next()).toEqual({
      done: false,
      value: '/c/d',
    });
    expect(generator.next()).toEqual({
      done: false,
      value: '/e/f',
    });
    expect(generator.next()).toEqual({
      done: false,
      value: '/g/h',
    });
    expect(generator.next()).toEqual({done: true, value: undefined});
  });

  it('returns initial values and additonally provided values when next(newValues) is called repeatedly', () => {
    const initialDirectories = forceVerificationOfDirectoryPaths(
      '/a/b',
      '/c/d'
    );
    const generator = directoryGenerator(initialDirectories);
    expect(generator.next()).toEqual({done: false, value: '/a/b'});
    const newValues = [aPath('/e/f'), aPath('/g/h')];
    expect(generator.next(newValues)).toEqual({
      done: false,
      value: '/a/b',
    });
    const newValues2 = [aPath('/i/j')];
    expect(generator.next(newValues2)).toEqual({
      done: false,
      value: '/a/b',
    });
    const newValues3 = [aPath('/k/l')];
    expect(generator.next(newValues3)).toEqual({
      done: false,
      value: '/a/b',
    });
    const expected = ['/c/d', '/e/f', '/g/h', '/i/j', '/k/l'];
    expect([...generator]).toEqual(expected);
  });

  it('additionally provided values are lost if they are provided with first next() call', () => {
    const initialDirectories = forceVerificationOfDirectoryPaths(
      '/a/b',
      '/c/d'
    );
    const generator = directoryGenerator(initialDirectories);
    const newValues = [aPath('/e/f'), aPath('/g/h')];
    expect(generator.next(newValues)).toEqual({done: false, value: '/a/b'});
    expect(generator.next()).toEqual({
      done: false,
      value: '/c/d',
    });
    expect(generator.next()).toEqual({done: true, value: undefined});
  });
});

describe('filePathGenerator()', () => {
  let resetWithLocalTmpDir: () => Promise<void>;

  beforeEach(async () => {
    resetWithLocalTmpDir = await withLocalTmpDir();
    await outputFiles({
      tmp: {
        anotherproject: {
          '.config': '123456',
        },
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
        bat: '12',
        bim: '123',
      },
    });
  });

  afterEach(async () => {
    await resetWithLocalTmpDir();
  });

  it('returns the expected file names and sizes', async () => {
    const initialDirectories = forceVerificationOfDirectoryPaths('tmp');
    const excludedNames: string[] = [];
    const followSymlinks = false;
    const includeDotFiles = false;
    const generator = filePathGenerator(
      initialDirectories,
      excludedNames,
      followSymlinks,
      includeDotFiles
    );
    const got: [Path, number][] = await asyncGeneratorToArray(generator);
    expect(got).toEqual([
      ['tmp/bat', 2],
      ['tmp/bim', 3],
      ['tmp/project/bar2', 9],
      ['tmp/project/foo2', 19],
    ]);
  });
});

describe('readDirectory()', () => {
  let resetWithLocalTmpDir: () => Promise<void>;

  beforeEach(async () => {
    resetWithLocalTmpDir = await withLocalTmpDir();
    await outputFiles({
      tmp: {
        anotherproject: {
          '.config': '123456',
        },
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
        '.yetanotherproject': {
          foo22: 'ya project content',
          bar22: '123456789',
        },
        '.ahiddenfile': '123',
        bat: '12',
        bim: '123',
        biz: '',
      },
    });
  });

  afterEach(async () => {
    await resetWithLocalTmpDir();
  });

  it('returns the expected file names and sizes and adds new directories to generatedDirs', async () => {
    const initialDirectories = forceVerificationOfDirectoryPaths('tmp');
    const excludedNames: string[] = [];
    const followSymlinks = false;
    const includeDotFiles = false;
    const entriesRead = new Set<number>();
    const dirGenerator = directoryGenerator(initialDirectories);
    // the dirGenerator must have next called on it at least once,
    // because if the first call to next() includes a parameter, that
    // parameter will be lost
    const {value: dir} = dirGenerator.next();
    if (!dir) throw new Error('dir unexpectedly falsy');
    const got = await readDirectory(
      dir,
      entriesRead,
      dirGenerator,
      excludedNames,
      followSymlinks,
      includeDotFiles
    );
    // tmp/biz should not be here because it is zero length
    expect(got).toEqual([
      ['tmp/bat', 2],
      ['tmp/bim', 3],
    ]);
    const generatedDirs = [...dirGenerator];
    expect(generatedDirs).toEqual([
      'tmp/anotherproject',
      'tmp/git',
      'tmp/project',
    ]);
  });

  it('excludes excluded names', async () => {
    const initialDirectories = forceVerificationOfDirectoryPaths('tmp');
    const excludedNames: string[] = ['bat', 'git'];
    const followSymlinks = false;
    const includeDotFiles = false;
    const entriesRead = new Set<number>();
    const dirGenerator = directoryGenerator(initialDirectories);
    // the dirGenerator must have next called on it at least once,
    // because if the first call to next() includes a parameter, that
    // parameter will be lost
    const {value: dir} = dirGenerator.next();
    if (!dir) throw new Error('dir unexpectedly falsy');
    const got = await readDirectory(
      dir,
      entriesRead,
      dirGenerator,
      excludedNames,
      followSymlinks,
      includeDotFiles
    );
    expect(got).toEqual([['tmp/bim', 3]]);
    const generatedDirs = [...dirGenerator];
    expect(generatedDirs).toEqual(['tmp/anotherproject', 'tmp/project']);
  });

  it('includes dot files when configured to do so', async () => {
    const initialDirectories = forceVerificationOfDirectoryPaths('tmp');
    const excludedNames: string[] = [];
    const followSymlinks = false;
    const includeDotFiles = true;
    const entriesRead = new Set<number>();
    const dirGenerator = directoryGenerator(initialDirectories);
    // the dirGenerator must have next called on it at least once,
    // because if the first call to next() includes a parameter, that
    // parameter will be lost
    const {value: dir} = dirGenerator.next();
    if (!dir) throw new Error('dir unexpectedly falsy');
    const got = await readDirectory(
      dir,
      entriesRead,
      dirGenerator,
      excludedNames,
      followSymlinks,
      includeDotFiles
    );
    expect(got).toEqual([
      ['tmp/.ahiddenfile', 3],
      ['tmp/bat', 2],
      ['tmp/bim', 3],
    ]);
    const generatedDirs = [...dirGenerator];
    expect(generatedDirs).toEqual([
      'tmp/.yetanotherproject',
      'tmp/anotherproject',
      'tmp/git',
      'tmp/project',
    ]);
  });
});

describe('createDirectoryReadingStream()', () => {
  let resetWithLocalTmpDir: () => Promise<void>;

  beforeEach(async () => {
    resetWithLocalTmpDir = await withLocalTmpDir();
    await outputFiles({
      tmp: {
        anotherproject: {
          '.config': '123456',
        },
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
        '.yetanotherproject': {
          foo22: 'ya project content',
          bar22: '123456789',
        },
        '.ahiddenfile': '123',
        bat: '12',
        bim: '123',
      },
    });
  });

  afterEach(async () => {
    await resetWithLocalTmpDir();
  });

  it('creates a readable stream that produces the expected output', async () => {
    const initialDirectories = forceVerificationOfDirectoryPaths('tmp');
    const excludedNames: string[] = [];
    const followSymlinks = false;
    const includeDotFiles = false;
    const readableStream = createDirectoryReadingStream(
      initialDirectories,
      excludedNames,
      followSymlinks,
      includeDotFiles
    );
    const got = await outputOfReadableStream(readableStream);
    const expected = [
      ['tmp/bat', 2],
      ['tmp/bim', 3],
      ['tmp/project/bar2', 9],
      ['tmp/project/foo2', 19],
    ];
    expect(got).toEqual(expected);
  });
});
