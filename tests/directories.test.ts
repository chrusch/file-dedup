// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

// ./src/tests/directories.test.ts
import {
  filesWithNonUniqueSizes,
  fileIsInDirectoryOrSubdirectory,
  getFilePaths,
  isSubdirectory,
} from '../src/directories';
import {silenceOutput} from '../src/display';
import {Path} from '../src/path';
import {
  forceVerificationOfDirectoryPaths,
  VerifiedDirectoryPath,
} from '../src/verified_directory_path';
jest.mock('fs');

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
    const dirs: VerifiedDirectoryPath[] =
      forceVerificationOfDirectoryPaths('/tmp');
    const excludeDirectoryNames: string[] = [];
    const includeDotfiles = false;
    const got = getFilePaths(dirs, excludeDirectoryNames, includeDotfiles);
    const expected: [Path, number, number][] = [
      [{path: '/tmp/project/foo'}, 29, 1007],
      [{path: '/tmp/project/bar'}, 72, 1008],
    ];
    expect(got).toEqual(expected);
  });

  it('returns expected files when dot files are included', () => {
    const dirs: VerifiedDirectoryPath[] =
      forceVerificationOfDirectoryPaths('/tmp');
    const excludeDirectoryNames: string[] = [];
    const includeDotfiles = true;
    const got = getFilePaths(dirs, excludeDirectoryNames, includeDotfiles);
    const expected: [Path, number, number][] = [
      [{path: '/tmp/git/.git/foo'}, 7, 1004],
      [{path: '/tmp/git/.git/bar'}, 8, 1005],
      [{path: '/tmp/project/foo'}, 29, 1007],
      [{path: '/tmp/project/bar'}, 72, 1008],
      [{path: '/tmp/another-project/.config'}, 31, 1010],
      [{path: '/tmp/another-project/.foo'}, 32, 1011],
    ];
    expect(got).toEqual(expected);
  });

  it('returns expected files when "project" is excluded', () => {
    const dirs: VerifiedDirectoryPath[] =
      forceVerificationOfDirectoryPaths('/tmp');
    const excludeDirectoryNames: string[] = ['project'];
    const includeDotfiles = true;
    const got = getFilePaths(dirs, excludeDirectoryNames, includeDotfiles);
    const expected: [Path, number, number][] = [
      [{path: '/tmp/git/.git/foo'}, 7, 1004],
      [{path: '/tmp/git/.git/bar'}, 8, 1005],
      [{path: '/tmp/another-project/.config'}, 31, 1010],
      [{path: '/tmp/another-project/.foo'}, 32, 1011],
    ];
    expect(got).toEqual(expected);
  });

  it('when given duplicate directories, ignores the second one', () => {
    // duplicate directory /tmp
    const dirs: VerifiedDirectoryPath[] = forceVerificationOfDirectoryPaths(
      '/tmp',
      '/tmp'
    );
    const excludeDirectoryNames: string[] = [];
    const includeDotfiles = false;
    const got = getFilePaths(dirs, excludeDirectoryNames, includeDotfiles);
    const expected: [Path, number, number][] = [
      [{path: '/tmp/project/foo'}, 29, 1007],
      [{path: '/tmp/project/bar'}, 72, 1008],
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
    const filesWithSizes: [Path, number][] = [
      [{path: '/a1'}, 3],
      [{path: '/a2'}, 7],
      [{path: '/a3'}, 12],
      [{path: '/a4'}, 10],
      [{path: '/a5'}, 12],
      [{path: '/a6'}, 3],
      [{path: '/a7'}, 2],
    ];
    const got = filesWithNonUniqueSizes(filesWithSizes);
    const expected: Path[] = [
      {path: '/a1'},
      {path: '/a3'},
      {path: '/a5'},
      {path: '/a6'},
    ];
    expect(got).toEqual(expected);
  });
});

describe('fileIsInDirectoryOrSubdirectory()', () => {
  it('when given a file that is a a parent directory, returns false', () => {
    const file = {path: '/foo/bar'};
    const dir = {path: '/foo/bar/baz'};
    const got: boolean = fileIsInDirectoryOrSubdirectory(file, dir);
    const expected = false;
    expect(got).toEqual(expected);
  });

  it('when given a file that is a sibling, returns false', () => {
    const file = {path: '/foo/bar'};
    const dir = {path: '/foo/baz'};
    const got: boolean = fileIsInDirectoryOrSubdirectory(file, dir);
    const expected = false;
    expect(got).toEqual(expected);
  });

  it('when given a file that is in the directory, returns true', () => {
    const file = {path: '/foo/bar/baz'};
    const dir = {path: '/foo/bar'};
    const got: boolean = fileIsInDirectoryOrSubdirectory(file, dir);
    const expected = true;
    expect(got).toEqual(expected);
  });
});
