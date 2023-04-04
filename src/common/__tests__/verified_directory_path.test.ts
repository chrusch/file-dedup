// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.
//
import {
  createOneVerifiedDirectoryPath,
  forceVerificationOfDirectoryPath,
  forceVerificationOfDirectoryPaths,
  isDirectory,
  normalize,
  verifyDirectoryPath,
  verifyDirectoryPaths,
  VerifiedDirectoryPath,
} from '../verified_directory_path';
import withLocalTmpDir from 'with-local-tmp-dir';
import outputFiles from 'output-files';
import {silenceOutput, testWarnMessages} from '../../handle_duplicates/display';
import {chmod} from 'node:fs/promises';

silenceOutput();

describe('createOneVerifiedDirectoryPath()', () => {
  let resetWithLocalTmpDir: () => Promise<void>;

  beforeEach(async () => {
    resetWithLocalTmpDir = await withLocalTmpDir();
    await outputFiles({
      dir1: {
        dir2: {
          'file1.txt': '123',
          'file2.txt': '123',
        },
      },
    });
  });

  afterEach(async () => {
    await resetWithLocalTmpDir();
  });

  it('when given a veriable normalized path, creates an identical verified directory path', () => {
    const givenPath = 'dir1/dir2';
    const got = createOneVerifiedDirectoryPath(givenPath);
    const expected = givenPath;
    expect(got).toEqual(expected);
  });

  it('when given a veriable unnormalized path, creates a verified normalized directory path', () => {
    const givenPath = './dir1/dir2';
    const expected = 'dir1/dir2';
    const got = createOneVerifiedDirectoryPath(givenPath);
    expect(got).toEqual(expected);
  });

  it('when given a file instead of a directory (i.e. a non-verifiable path), outputs an error and returns undefined', () => {
    const givenPath = './dir1/dir2/file1.txt';
    const expected = undefined;
    const got = createOneVerifiedDirectoryPath(givenPath);
    expect(got).toEqual(expected);
    expect(testWarnMessages).toEqual([
      'please provide a path to a directory (not a regular file or symlink): ignoring ./dir1/dir2/file1.txt',
    ]);
  });
});

describe('verifyDirectoryPaths()', () => {
  let resetWithLocalTmpDir: () => Promise<void>;

  beforeEach(async () => {
    resetWithLocalTmpDir = await withLocalTmpDir();
    await outputFiles({
      dir1: {
        dir2: {
          'file1.txt': '123',
          'file2.txt': '123',
        },
      },
    });
  });

  afterEach(async () => {
    await resetWithLocalTmpDir();
  });

  it('when given a list of verifiable and unverifiable paths, returns the verifiable paths as VerifiedDirectoryPaths', () => {
    const paths = [
      'dir1',
      'dir1/dir2/file1.txt',
      'dir1/dir2/file2.txt',
      'dir1/dir2/file3.txt',
      'dir1/dir2',
      'dir2',
    ];
    const got: VerifiedDirectoryPath[] = verifyDirectoryPaths(...paths);
    const expected = ['dir1', 'dir1/dir2'];
    expect(got).toEqual(expected);
    expect(testWarnMessages.splice(-4)).toEqual([
      'please provide a path to a directory (not a regular file or symlink): ignoring dir1/dir2/file1.txt',
      'please provide a path to a directory (not a regular file or symlink): ignoring dir1/dir2/file2.txt',
      'please provide a path for an existing directory: ignoring dir1/dir2/file3.txt',
      'please provide a path for an existing directory: ignoring dir2',
    ]);
  });
});

describe('forceVerificationOfDirectoryPaths()', () => {
  it('forces the verification of strings as directory path', () => {
    const paths = ['/some/path', '/a/path', '/a/b', 'd', '../d'];
    const got: VerifiedDirectoryPath[] = forceVerificationOfDirectoryPaths(
      ...paths
    );
    const expected = paths;
    expect(got).toEqual(expected);
  });
});

describe('forceVerificationOfDirectoryPaths()', () => {
  it('forces the verification of a string as a directory path', () => {
    const path = '..f3428ujfksd[]..],]..]././]***'; // random string
    const got: VerifiedDirectoryPath = forceVerificationOfDirectoryPath(path);
    const expected = path;
    expect(got).toEqual(expected);
  });
});

describe('verifyDirectoryPath()', () => {
  let resetWithLocalTmpDir: () => Promise<void>;

  beforeEach(async () => {
    resetWithLocalTmpDir = await withLocalTmpDir();
    await outputFiles({
      dir1: {
        dir2: {
          'file1.txt': '123',
          'file2.txt': '123',
        },
      },
    });
  });

  afterEach(async () => {
    await resetWithLocalTmpDir();
  });

  it('verifies that a path is a real readable, accessible directory', () => {
    const path = 'dir1/dir2';
    const got = verifyDirectoryPath(path);
    const expected = undefined;
    expect(got).toEqual(expected);
  });

  it('throws an error when given a regular file instead of directory', () => {
    const path = 'dir1/dir2/file1.txt';
    const expectedError =
      'please provide a path to a directory (not a regular file or symlink)';
    expect(() => verifyDirectoryPath(path)).toThrowError(expectedError);
  });

  it('throws an error when given a regular file instead of directory', () => {
    const path = 'dir1/dir2/dir3';
    const expectedError = 'please provide a path for an existing directory';
    expect(() => verifyDirectoryPath(path)).toThrowError(expectedError);
  });

  it('throws an error when given an undefined value', () => {
    const path = undefined;
    const expectedError = 'please provide a path that is a valid string';
    expect(() => verifyDirectoryPath(path)).toThrowError(expectedError);
  });

  it('throws an error when the directory is inaccessible', async () => {
    const path = 'dir1/dir2';
    await chmod(path, 0o300);
    const expectedError =
      'please provide a path to a directory you have permission to read';
    expect(() => verifyDirectoryPath(path)).toThrowError(expectedError);
    await chmod(path, 0o700);
  });
});

describe('normalize()', () => {
  it('normalizes a path string', () => {
    const path = 'foo/bar/../../baz';
    const got = normalize(path);
    const expected = 'baz';
    expect(got).toEqual(expected);
  });
  it('returns undefined when it cannot normalize the path string', () => {
    const path = undefined as unknown as string;
    const got = normalize(path);
    const expected = undefined;
    expect(got).toEqual(expected);
  });
});

describe('isDirectory()', () => {
  let resetWithLocalTmpDir: () => Promise<void>;

  beforeEach(async () => {
    resetWithLocalTmpDir = await withLocalTmpDir();
    await outputFiles({
      dir1: {
        dir2: {
          'file1.txt': '123',
          'file2.txt': '123',
        },
      },
    });
  });

  afterEach(async () => {
    await resetWithLocalTmpDir();
  });

  it('returns true when given a directory', () => {
    const path = 'dir1/dir2';
    const got = isDirectory(path);
    const expected = true;
    expect(got).toEqual(expected);
  });

  it('returns false when given a file', () => {
    const path = 'dir1/dir2/file1.txt';
    const got = isDirectory(path);
    const expected = false;
    expect(got).toEqual(expected);
  });

  it('returns false when given a non-existent file', () => {
    const path = 'dir1/dir2/file9.txt';
    const got = isDirectory(path);
    const expected = false;
    expect(got).toEqual(expected);
  });
});
