// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {
  deleteOrListDuplicates,
  fileIsInADeleteDirectory,
} from '../src/remove_duplicates';
import fs from 'fs';
import * as delete_file from '../src/delete_file';
import * as interaction from '../src/interaction';
import {silenceOutput} from '../src/display';
/* eslint-disable-next-line node/no-unpublished-import */
import {jest} from '@jest/globals'; // needed for jest.Mocked
import Path from '../src/path';
import {
  forceVerificationOfDirectoryPaths,
  VerifiedDirectoryPath,
} from '../src/verified_directory_path';
jest.mock('fs');
jest.mock('../src/delete_file.ts');
jest.mock('../src/interaction.ts');

describe('fileIsInADeleteDirectory()', () => {
  it('when file is in given directory, return true', () => {
    const file = {path: '/tmp/foo'};
    const dirs: VerifiedDirectoryPath[] = forceVerificationOfDirectoryPaths(
      '/foo',
      '/tmp'
    );
    const got = fileIsInADeleteDirectory(file, dirs);
    const expected = true;
    expect(got).toEqual(expected);
    expect(fs.realpathSync).toHaveBeenCalledTimes(4);
    expect(fs.realpathSync).toHaveBeenNthCalledWith(1, '/tmp/foo');
    expect(fs.realpathSync).toHaveBeenNthCalledWith(2, '/foo');
    expect(fs.realpathSync).toHaveBeenNthCalledWith(3, '/tmp/foo');
    expect(fs.realpathSync).toHaveBeenNthCalledWith(4, '/tmp');
  });

  it('when file is not in given directory, return false', () => {
    const file = {path: '/other/foo'};
    const dirs: VerifiedDirectoryPath[] = forceVerificationOfDirectoryPaths(
      '/foo',
      '/tmp'
    );
    const got = fileIsInADeleteDirectory(file, dirs);
    const expected = false;
    expect(got).toEqual(expected);
    expect(fs.realpathSync).toHaveBeenCalledTimes(4);
    expect(fs.realpathSync).toHaveBeenNthCalledWith(1, '/other/foo');
    expect(fs.realpathSync).toHaveBeenNthCalledWith(2, '/foo');
    expect(fs.realpathSync).toHaveBeenNthCalledWith(3, '/other/foo');
    expect(fs.realpathSync).toHaveBeenNthCalledWith(4, '/tmp');
  });

  it('when there is no dir specified, return false', () => {
    const file = {path: '/other/foo'};
    const dirs: VerifiedDirectoryPath[] = [];
    const got = fileIsInADeleteDirectory(file, dirs);
    const expected = false;
    expect(got).toEqual(expected);
    expect(fs.realpathSync).toHaveBeenCalledTimes(0);
  });
});

describe('deleteOrListDuplicates()', () => {
  beforeAll(silenceOutput);
  it('automatically deletes files (but not really)', () => {
    const duplicateFiles: Path[][] = [
      [{path: '/del/a'}, {path: '/other/b'}],
      [{path: '/other/e'}, {path: '/del/c'}, {path: '/other/d'}],
    ];
    const dirsToAutomaticallyDeleteFrom: VerifiedDirectoryPath[] =
      forceVerificationOfDirectoryPaths('/del');
    const reallyDelete = false;
    const interactiveDeletion = false;
    const got = deleteOrListDuplicates(
      duplicateFiles,
      dirsToAutomaticallyDeleteFrom,
      reallyDelete,
      interactiveDeletion
    );
    const expected = undefined;
    expect(got).toEqual(expected);
    expect(delete_file.deleteFile).toHaveBeenCalledTimes(2);
    type DF = jest.Mocked<typeof delete_file.deleteFile>;
    expect(delete_file.deleteFile as DF).toHaveBeenNthCalledWith(1, false, {
      path: '/del/a',
    });
    expect(delete_file.deleteFile as DF).toHaveBeenNthCalledWith(2, false, {
      path: '/del/c',
    });
  });

  it('automatically deletes files (yes, really deletes)', () => {
    const duplicateFiles: Path[][] = [
      [{path: '/del/a'}, {path: '/other/b'}],
      [{path: '/other/e'}, {path: '/del/c'}, {path: '/other/d'}],
    ];
    const dirsToAutomaticallyDeleteFrom: VerifiedDirectoryPath[] =
      forceVerificationOfDirectoryPaths('/del');
    const reallyDelete = true;
    const interactiveDeletion = false;
    const got = deleteOrListDuplicates(
      duplicateFiles,
      dirsToAutomaticallyDeleteFrom,
      reallyDelete,
      interactiveDeletion
    );
    const expected = undefined;
    expect(got).toEqual(expected);
    expect(delete_file.deleteFile).toHaveBeenCalledTimes(2);
    type DF = jest.Mocked<typeof delete_file.deleteFile>;
    expect(delete_file.deleteFile as DF).toHaveBeenNthCalledWith(1, true, {
      path: '/del/a',
    });
    expect(delete_file.deleteFile as DF).toHaveBeenNthCalledWith(2, true, {
      path: '/del/c',
    });
  });

  it('interactively deletes files', () => {
    (
      interaction.confirmDelete as unknown as jest.Mocked<
        typeof interaction.confirmDelete
      >
    ).mockReturnValue(true);

    const duplicateFiles: Path[][] = [
      [{path: '/del/a'}, {path: '/other/b'}],
      [{path: '/other/e'}, {path: '/del/c'}, {path: '/other/d'}],
    ];
    const dirsToAutomaticallyDeleteFrom: VerifiedDirectoryPath[] = [];
    const reallyDelete = true;
    const interactiveDeletion = true;
    const got = deleteOrListDuplicates(
      duplicateFiles,
      dirsToAutomaticallyDeleteFrom,
      reallyDelete,
      interactiveDeletion
    );
    const expected = undefined;
    expect(got).toEqual(expected);
    expect(interaction.confirmDelete).toHaveBeenCalledTimes(3);

    expect(delete_file.deleteFile).toHaveBeenCalledTimes(3);
    type DF = jest.Mocked<typeof delete_file.deleteFile>;
    expect(delete_file.deleteFile as DF).toHaveBeenNthCalledWith(1, true, {
      path: '/del/a',
    });
    expect(delete_file.deleteFile as DF).toHaveBeenNthCalledWith(2, true, {
      path: '/other/e',
    });
    expect(delete_file.deleteFile as DF).toHaveBeenNthCalledWith(3, true, {
      path: '/del/c',
    });
  });

  it('interactively choose not to delete files', () => {
    (
      interaction.confirmDelete as unknown as jest.Mocked<
        typeof interaction.confirmDelete
      >
    ).mockReturnValue(false);

    const duplicateFiles: Path[][] = [
      [{path: '/del/a'}, {path: '/other/b'}],
      [{path: '/other/e'}, {path: '/del/c'}, {path: '/other/d'}],
    ];
    const dirsToAutomaticallyDeleteFrom: VerifiedDirectoryPath[] = [];
    const reallyDelete = true;
    const interactiveDeletion = true;
    const got = deleteOrListDuplicates(
      duplicateFiles,
      dirsToAutomaticallyDeleteFrom,
      reallyDelete,
      interactiveDeletion
    );
    const expected = undefined;
    expect(got).toEqual(expected);
    expect(interaction.confirmDelete).toHaveBeenCalledTimes(5);

    expect(delete_file.deleteFile).toHaveBeenCalledTimes(0);
    type ARD = jest.Mocked<typeof interaction.confirmDelete>;
    expect(interaction.confirmDelete as ARD).toHaveBeenNthCalledWith(
      1,
      '/del/a'
    );
    expect(interaction.confirmDelete as ARD).toHaveBeenNthCalledWith(
      2,
      '/other/b'
    );
    expect(interaction.confirmDelete as ARD).toHaveBeenNthCalledWith(
      3,
      '/other/e'
    );
    expect(interaction.confirmDelete as ARD).toHaveBeenNthCalledWith(
      4,
      '/del/c'
    );
    expect(interaction.confirmDelete as ARD).toHaveBeenNthCalledWith(
      5,
      '/other/d'
    );
  });

  it('interactively choose to delete some files but not others', () => {
    (
      interaction.confirmDelete as unknown as jest.Mocked<
        typeof interaction.confirmDelete
      >
    )
      .mockReturnValue(false)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true);

    const duplicateFiles: Path[][] = [
      [{path: '/del/a'}, {path: '/other/b'}],
      [{path: '/other/e'}, {path: '/del/c'}, {path: '/other/d'}],
    ];
    const dirsToAutomaticallyDeleteFrom: VerifiedDirectoryPath[] = [];
    const reallyDelete = true;
    const interactiveDeletion = true;
    const got = deleteOrListDuplicates(
      duplicateFiles,
      dirsToAutomaticallyDeleteFrom,
      reallyDelete,
      interactiveDeletion
    );
    const expected = undefined;
    expect(got).toEqual(expected);
    expect(interaction.confirmDelete).toHaveBeenCalledTimes(4);

    expect(delete_file.deleteFile).toHaveBeenCalledTimes(2);
    type ARD = jest.Mocked<typeof interaction.confirmDelete>;
    expect(interaction.confirmDelete as ARD).toHaveBeenNthCalledWith(
      1,
      '/del/a'
    );
    expect(interaction.confirmDelete as ARD).toHaveBeenNthCalledWith(
      2,
      '/other/e'
    );
    expect(interaction.confirmDelete as ARD).toHaveBeenNthCalledWith(
      3,
      '/del/c'
    );
    expect(interaction.confirmDelete as ARD).toHaveBeenNthCalledWith(
      4,
      '/other/d'
    );

    type DF = jest.Mocked<typeof delete_file.deleteFile>;
    expect(delete_file.deleteFile as DF).toHaveBeenNthCalledWith(1, true, {
      path: '/del/a',
    });
    expect(delete_file.deleteFile as DF).toHaveBeenNthCalledWith(2, true, {
      path: '/other/e',
    });
  });
});
