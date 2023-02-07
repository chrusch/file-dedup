// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

// ./src/tests/directories.test.ts
import {filesWithNonUniqueSizes, getFilePaths} from '../directories';
import {silenceOutput} from '../../handle_duplicates/display';
import {aPath, Path} from '../../path';
import {
  forceVerificationOfDirectoryPaths,
  VerifiedDirectoryPath,
} from '../../verified_directory_path';
jest.mock('fs');

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
    const followSymlinks = false;
    const includeDotfiles = false;
    const got = getFilePaths(
      dirs,
      excludeDirectoryNames,
      followSymlinks,
      includeDotfiles
    );
    const expected: [Path, number, number][] = [
      [aPath('/tmp/project/foo'), 29, 1007],
      [aPath('/tmp/project/bar'), 72, 1008],
    ];
    expect(got).toEqual(expected);
  });

  it('returns expected files when dot files are included', () => {
    const dirs: VerifiedDirectoryPath[] =
      forceVerificationOfDirectoryPaths('/tmp');
    const excludeDirectoryNames: string[] = [];
    const followSymlinks = false;
    const includeDotfiles = true;
    const got = getFilePaths(
      dirs,
      excludeDirectoryNames,
      followSymlinks,
      includeDotfiles
    );
    const expected: [Path, number, number][] = [
      [aPath('/tmp/git/.git/foo'), 7, 1004],
      [aPath('/tmp/git/.git/bar'), 8, 1005],
      [aPath('/tmp/project/foo'), 29, 1007],
      [aPath('/tmp/project/bar'), 72, 1008],
      [aPath('/tmp/another-project/.config'), 31, 1010],
      [aPath('/tmp/another-project/.foo'), 32, 1011],
    ];
    expect(got).toEqual(expected);
  });

  it('returns expected files when "project" is excluded', () => {
    const dirs: VerifiedDirectoryPath[] =
      forceVerificationOfDirectoryPaths('/tmp');
    const excludeDirectoryNames: string[] = ['project'];
    const followSymlinks = false;
    const includeDotfiles = true;
    const got = getFilePaths(
      dirs,
      excludeDirectoryNames,
      followSymlinks,
      includeDotfiles
    );
    const expected: [Path, number, number][] = [
      [aPath('/tmp/git/.git/foo'), 7, 1004],
      [aPath('/tmp/git/.git/bar'), 8, 1005],
      [aPath('/tmp/another-project/.config'), 31, 1010],
      [aPath('/tmp/another-project/.foo'), 32, 1011],
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
    const followSymlinks = false;
    const includeDotfiles = false;
    const got = getFilePaths(
      dirs,
      excludeDirectoryNames,
      followSymlinks,
      includeDotfiles
    );
    const expected: [Path, number, number][] = [
      [aPath('/tmp/project/foo'), 29, 1007],
      [aPath('/tmp/project/bar'), 72, 1008],
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
      [aPath('/a1'), 3],
      [aPath('/a2'), 7],
      [aPath('/a3'), 12],
      [aPath('/a4'), 10],
      [aPath('/a5'), 12],
      [aPath('/a6'), 3],
      [aPath('/a7'), 2],
    ];
    const got = filesWithNonUniqueSizes(filesWithSizes);
    const expected: Path[] = [
      aPath('/a1'),
      aPath('/a3'),
      aPath('/a5'),
      aPath('/a6'),
    ];
    expect(got).toEqual(expected);
  });
});
