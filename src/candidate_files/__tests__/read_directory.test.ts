// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {readDirectory} from '../read_directory';
import {aPath} from '../../common/path';
jest.mock('fs');

describe('readDirectory()', () => {
  const fs = require('fs');
  const MOCK_FILE_INFO = {
    '/tmp': '',
    '/tmp/git': '',
    '/tmp/git/.git': '',
    '/tmp/git/.git/foo': 'foo content',
    '/tmp/git/.git/bar': 'bar content',
    '/tmp/project': '',
    '/tmp/project/foo': 'foo project content',
    '/tmp/project/bar': 'bar project content',
    '/tmp/another-project': '',
    '/tmp/another-project/.config': 'baz project content',
    '/tmp/another-project/.foo': 'bam project content',
  };

  beforeEach(() => {
    fs.__setMockFiles(MOCK_FILE_INFO);
  });

  const dirCallback = (): void => {
    throw new Error('in dir callback');
  };
  const fileCallback = (): void => {
    throw new Error('in file callback');
  };

  it('excludes excluded files', () => {
    const folder = aPath('/tmp/project');
    const excludedNames: string[] = ['foo', 'bar'];
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
    const folder = aPath('/tmp/git');
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
    const folder = aPath('/tmp/project');
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
    expect(functionCall).toThrowError('in file callback');
  });

  it('includes included directories', () => {
    const folder = aPath('/tmp/git');
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
    expect(functionCall).toThrowError('in dir callback');
  });

  it('excludes dotfiles when configured to do so ', () => {
    const folder = aPath('/tmp/another-project');
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
    const folder = aPath('/tmp/another-project');
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
    expect(functionCall).toThrowError('in file callback');
  });
});
