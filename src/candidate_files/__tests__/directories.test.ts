// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

// ./src/tests/directories.test.ts
import {filesWithNonUniqueSizesOld, getFilePaths} from '../directories';
import {silenceOutput} from '../../handle_duplicates/display';
import {aPath, Path} from '../../common/path';
import withLocalTmpDir from 'with-local-tmp-dir';
import outputFiles from 'output-files';
import {
  forceVerificationOfDirectoryPaths,
  VerifiedDirectoryPath,
} from '../../common/verified_directory_path';

describe('getFilePaths()', () => {
  let resetWithLocalTmpDir: () => Promise<void>;

  beforeEach(async () => {
    resetWithLocalTmpDir = await withLocalTmpDir();
    await outputFiles({
      tmp: {
        anotherproject: {
          '.config': '123',
          '.foo': '123',
        },
        git: {
          '.git': {
            foo: 'foo',
            bar: 'bar',
          },
        },
        project: {
          foo: '987',
          bar: '123',
        },
      },
    });
  });

  afterEach(async () => {
    await resetWithLocalTmpDir();
  });

  it('returns expected files when dot files are not included', async () => {
    const dirs: VerifiedDirectoryPath[] =
      forceVerificationOfDirectoryPaths('tmp');
    const excludeDirectoryNames: string[] = [];
    const followSymlinks = false;
    const includeDotfiles = false;
    const got = await getFilePaths(
      dirs,
      excludeDirectoryNames,
      followSymlinks,
      includeDotfiles
    );
    const expected: [Path, number][] = [
      [aPath('tmp/project/bar'), 3],
      [aPath('tmp/project/foo'), 3],
    ];
    got.sort((a, b) => a[0].localeCompare(b[0]));
    expect(got).toEqual(expected);
  });

  it('returns expected files when dot files are included', async () => {
    const dirs: VerifiedDirectoryPath[] =
      forceVerificationOfDirectoryPaths('tmp');
    const excludeDirectoryNames: string[] = [];
    const followSymlinks = false;
    const includeDotfiles = true;
    const got = await getFilePaths(
      dirs,
      excludeDirectoryNames,
      followSymlinks,
      includeDotfiles
    );
    const expected: [Path, number][] = [
      [aPath('tmp/anotherproject/.config'), 3],
      [aPath('tmp/anotherproject/.foo'), 3],
      [aPath('tmp/git/.git/bar'), 3],
      [aPath('tmp/git/.git/foo'), 3],
      [aPath('tmp/project/bar'), 3],
      [aPath('tmp/project/foo'), 3],
    ];
    got.sort((a, b) => a[0].localeCompare(b[0]));
    expect(got).toEqual(expected);
  });

  it('returns expected files when "project" is excluded', async () => {
    const dirs: VerifiedDirectoryPath[] =
      forceVerificationOfDirectoryPaths('tmp');
    const excludeDirectoryNames: string[] = ['project'];
    const followSymlinks = false;
    const includeDotfiles = true;
    const got = await getFilePaths(
      dirs,
      excludeDirectoryNames,
      followSymlinks,
      includeDotfiles
    );
    const expected: [Path, number][] = [
      [aPath('tmp/anotherproject/.config'), 3],
      [aPath('tmp/anotherproject/.foo'), 3],
      [aPath('tmp/git/.git/bar'), 3],
      [aPath('tmp/git/.git/foo'), 3],
    ];
    got.sort((a, b) => a[0].localeCompare(b[0]));
    expect(got).toEqual(expected);
  });

  it('when given duplicate directories, ignores the second one', async () => {
    // duplicate directory tmp
    const dirs: VerifiedDirectoryPath[] = forceVerificationOfDirectoryPaths(
      'tmp',
      'tmp'
    );
    const excludeDirectoryNames: string[] = [];
    const followSymlinks = false;
    const includeDotfiles = false;
    const got = await getFilePaths(
      dirs,
      excludeDirectoryNames,
      followSymlinks,
      includeDotfiles
    );
    const gotFilesSorted = got.map(a => a[0]).sort();
    const gotSizesSorted = got.map(a => a[1]).sort();
    const expectedSizesSorted: number[] = [3, 3];
    const expectedFilesSorted: Path[] = [
      aPath('tmp/project/bar'),
      aPath('tmp/project/foo'),
    ];
    // output indicate that all branches in this function are fully covered by tests:
    expect(gotFilesSorted).toEqual(expectedFilesSorted);
    expect(gotSizesSorted).toEqual(expectedSizesSorted);
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
    const got = filesWithNonUniqueSizesOld(filesWithSizes);
    const expected: Path[] = [
      aPath('/a1'),
      aPath('/a3'),
      aPath('/a5'),
      aPath('/a6'),
    ];
    expect(got.sort()).toEqual(expected);
  });
});
