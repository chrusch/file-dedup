// Copyright (c) 2022, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

// ./src/tests/directories.test.ts
import {
  directoriesOverlapNotUsed,
  filesWithNonUniqueSizes,
  fileIsInDirectoryOrSubdirectory,
  getFilePaths,
  isSubdirectory,
} from '../src/directories';
import {silenceOutput} from '../src/display';
jest.mock('fs');

describe('directoriesOverlap()', () => {
  it('given two directories that overlap, returns true', () => {
    const dir1 = '/usr';
    const dir2 = '/usr/local';
    const got = directoriesOverlapNotUsed(dir1, dir2);
    const expected = true;
    expect(got).toEqual(expected);
  });
  it('given two other directories that overlap, returns true', () => {
    const dir1 = '/usr/local';
    const dir2 = '/usr';
    const got = directoriesOverlapNotUsed(dir1, dir2);
    const expected = true;
    expect(got).toEqual(expected);
  });
  it('given two directories that are the same, returns true', () => {
    const dir1 = '/usr';
    const dir2 = '/usr';
    const got = directoriesOverlapNotUsed(dir1, dir2);
    const expected = true;
    expect(got).toEqual(expected);
  });
  it('given two directories that do not overlap, returns false', () => {
    const dir1 = '/tmp';
    const dir2 = '/Users';
    const got = directoriesOverlapNotUsed(dir1, dir2);
    const expected = false;
    expect(got).toEqual(expected);
  });
});

describe('isSubdirectory()', () => {
  it('returns true if the relative path is a subdirectory of the base path', () => {
    const relativePath = 'foo/bar';
    const got = isSubdirectory(relativePath);
    const expected = true;
    expect(got).toEqual(expected);
  });

  it('returns false if the relative path is not a subdirectory of the base path', () => {
    const relativePath = '../foo/bar';
    const got = isSubdirectory(relativePath);
    const expected = false;
    expect(got).toEqual(expected);
  });

  it('returns false if the relative path is a parent directory of the base path', () => {
    const relativePath = '..';
    const got = isSubdirectory(relativePath);
    const expected = false;
    expect(got).toEqual(expected);
  });

  it('returns false if the relative path is a parent directory of the base path', () => {
    const relativePath = '../';
    const got = isSubdirectory(relativePath);
    const expected = false;
    expect(got).toEqual(expected);
  });

  it('returns true if the relative path points to the base path', () => {
    const relativePath = '';
    const got = isSubdirectory(relativePath);
    const expected = true;
    expect(got).toEqual(expected);
  });
});

describe('getFilePaths()', () => {
  const MOCK_FILE_INFO = {
    '/tmp': [1001, 256],
    '/tmp/git': [1002, 256],
    '/tmp/git/.git': [1003, 256],
    '/tmp/git/.git/foo': [1004, 7],
    '/tmp/git/.git/bar': [1005, 8],
    '/tmp/project': [1006, 256],
    '/tmp/project/foo': [1007, 29],
    '/tmp/project/bar': [1008, 72],
    '/tmp/another-project': [1009, 256],
    '/tmp/another-project/.config': [1010, 31],
    '/tmp/another-project/.foo': [1011, 32],
  };

  beforeEach(() => {
    require('fs').__setMockFiles(MOCK_FILE_INFO);
  });

  it('returns expected files when dot files are not included', () => {
    const dirs: string[] = ['/tmp'];
    const excludeDirectoryNames: string[] = [];
    const includeDotfiles = false;
    const got = getFilePaths(dirs, excludeDirectoryNames, includeDotfiles);
    const expected: [string, number, number][] = [
      ['/tmp/project/foo', 29, 1007],
      ['/tmp/project/bar', 72, 1008],
    ];
    expect(got).toEqual(expected);
  });

  it('returns expected files when dot files are included', () => {
    const dirs: string[] = ['/tmp'];
    const excludeDirectoryNames: string[] = [];
    const includeDotfiles = true;
    const got = getFilePaths(dirs, excludeDirectoryNames, includeDotfiles);
    const expected: [string, number, number][] = [
      ['/tmp/git/.git/foo', 7, 1004],
      ['/tmp/git/.git/bar', 8, 1005],
      ['/tmp/project/foo', 29, 1007],
      ['/tmp/project/bar', 72, 1008],
      ['/tmp/another-project/.config', 31, 1010],
      ['/tmp/another-project/.foo', 32, 1011],
    ];
    expect(got).toEqual(expected);
  });

  it('returns expected files when "project" is excluded', () => {
    const dirs: string[] = ['/tmp'];
    const excludeDirectoryNames: string[] = ['project'];
    const includeDotfiles = true;
    const got = getFilePaths(dirs, excludeDirectoryNames, includeDotfiles);
    const expected: [string, number, number][] = [
      ['/tmp/git/.git/foo', 7, 1004],
      ['/tmp/git/.git/bar', 8, 1005],
      ['/tmp/another-project/.config', 31, 1010],
      ['/tmp/another-project/.foo', 32, 1011],
    ];
    expect(got).toEqual(expected);
  });

  it('when given duplicate directories, ignores the second one', () => {
    // duplicate directory /tmp
    const dirs: string[] = ['/tmp', '/tmp'];
    const excludeDirectoryNames: string[] = [];
    const includeDotfiles = false;
    const got = getFilePaths(dirs, excludeDirectoryNames, includeDotfiles);
    const expected: [string, number, number][] = [
      ['/tmp/project/foo', 29, 1007],
      ['/tmp/project/bar', 72, 1008],
    ];
    // output indicate that all branches in this function are fully covered by tests:
    expect(got).toEqual(expected);
  });
});

describe('filesWithNonUniqueSizes()', () => {
  beforeAll(() => {
    silenceOutput();
  });

  it('returns a list of files with duplicate sizes', () => {
    silenceOutput();
    const filesWithSizes: [string, number][] = [
      ['a1', 3],
      ['a2', 7],
      ['a3', 12],
      ['a4', 10],
      ['a5', 12],
      ['a6', 3],
      ['a7', 2],
    ];
    const got = filesWithNonUniqueSizes(filesWithSizes);
    const expected: string[] = ['a1', 'a3', 'a5', 'a6'];
    expect(got).toEqual(expected);
  });
});

describe('fileIsInDirectoryOrSubdirectory()', () => {
  it('does what is expected', () => {
    const file = '/foo/bar';
    const dir = '/foo/bar/baz';
    const got: boolean = fileIsInDirectoryOrSubdirectory(file, dir);
    const expected = false;
    expect(got).toEqual(expected);
  });

  it('does what is expected', () => {
    const file = '/foo/bar';
    const dir = '/foo/baz';
    const got: boolean = fileIsInDirectoryOrSubdirectory(file, dir);
    const expected = false;
    expect(got).toEqual(expected);
  });

  it('does what is expected', () => {
    const file = '/foo/bar/baz';
    const dir = '/foo/bar';
    const got: boolean = fileIsInDirectoryOrSubdirectory(file, dir);
    const expected = true;
    expect(got).toEqual(expected);
  });
});
