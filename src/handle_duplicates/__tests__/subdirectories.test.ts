// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

// ./src/tests/directories.test.ts
import {
  fileIsInDirectoryOrSubdirectory,
  isSubdirectory,
} from '../subdirectories';
import {aPath} from '../../common/path';
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

describe('fileIsInDirectoryOrSubdirectory()', () => {
  it('when given a file that is a a parent directory, returns false', () => {
    const file = aPath('/foo/bar');
    const dir = aPath('/foo/bar/baz');
    const got: boolean = fileIsInDirectoryOrSubdirectory(file, dir);
    const expected = false;
    expect(got).toEqual(expected);
  });

  it('when given a file that is a sibling, returns false', () => {
    const file = aPath('/foo/bar');
    const dir = aPath('/foo/baz');
    const got: boolean = fileIsInDirectoryOrSubdirectory(file, dir);
    const expected = false;
    expect(got).toEqual(expected);
  });

  it('when given a file that is in the directory, returns true', () => {
    const file = aPath('/foo/bar/baz');
    const dir = aPath('/foo/bar');
    const got: boolean = fileIsInDirectoryOrSubdirectory(file, dir);
    const expected = true;
    expect(got).toEqual(expected);
  });
});
