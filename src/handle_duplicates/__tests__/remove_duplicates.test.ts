// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {
  fileIsInADeleteDirectory,
  getHandleDuplicatesStream,
  handleDuplicatesList,
  HandleDuplicatesListOptions,
} from '../remove_duplicates';
import {lastLogMessages, silenceOutput} from '../display';
import {setTestPrompt} from '../interaction';
import {aPath, Path} from '../../common/path';
import {
  exists,
  forceVerificationOfDirectoryPaths,
  VerifiedDirectoryPath,
} from '../../common/verified_directory_path';
import withLocalTmpDir from 'with-local-tmp-dir';
import outputFiles from 'output-files';
import {inputToWritableStream} from '../../__tests__/test_utilities';

silenceOutput();
describe('fileIsInADeleteDirectory()', () => {
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

  it('when file is in given directory, return true', () => {
    const file = aPath('tmp/anotherproject/.config');
    const dirs: VerifiedDirectoryPath[] = forceVerificationOfDirectoryPaths(
      'tmp/anotherproject',
      'tmp/git'
    );
    const got = fileIsInADeleteDirectory(file, dirs);
    const expected = true;
    expect(got).toEqual(expected);
  });

  it('when file is not in given directory, return false', () => {
    const file = aPath('tmp/project/foo2');
    const dirs: VerifiedDirectoryPath[] = forceVerificationOfDirectoryPaths(
      'tmp/anotherproject',
      'tmp/git'
    );
    const got = fileIsInADeleteDirectory(file, dirs);
    const expected = false;
    expect(got).toEqual(expected);
  });

  it('when there is no dir specified, return false', () => {
    const file = aPath('tmp/project/foo2');
    const dirs: VerifiedDirectoryPath[] = [];
    const got = fileIsInADeleteDirectory(file, dirs);
    const expected = false;
    expect(got).toEqual(expected);
  });
});

describe('handleDuplicatesList()', () => {
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
            bar222: '123456789',
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

  it('automatically deletes files in automatic deletion mode', () => {
    const duplicatesList = [
      aPath('tmp/project/bar2'),
      aPath('tmp/git/.git/bar222'),
      aPath('tmp/.yetanotherproject/bar22'),
    ];
    let numDeleted = 0;
    const trackTotalDeleted = () => {
      numDeleted++;
    };
    const reallyDelete = true;
    const autoDeletion = true;
    const dirsToAutomaticallyDeleteFrom =
      forceVerificationOfDirectoryPaths('tmp/project');
    const interactiveDeletion = false;
    const options: HandleDuplicatesListOptions = {
      duplicatesList,
      trackTotalDeleted,
      reallyDelete,
      autoDeletion,
      interactiveDeletion,
      dirsToAutomaticallyDeleteFrom,
    };
    handleDuplicatesList(options);
    expect(numDeleted).toEqual(1);
    expect(exists('tmp/project/bar2')).toEqual(false);
    expect(exists('tmp/.yetanotherproject/bar22')).toEqual(true);
    expect(exists('tmp/git/.git/bar222')).toEqual(true);
    const expectedMessages = [
      [
        'Duplicates',
        [
          'tmp/project/bar2',
          'tmp/git/.git/bar222',
          'tmp/.yetanotherproject/bar22',
        ],
      ],
      ['deleting tmp/project/bar2;'],
    ];
    expect(lastLogMessages(2)).toEqual(expectedMessages);
  });

  it('interactively deletes files in interactive deletion mode', () => {
    const duplicatesList = [
      aPath('tmp/project/bar2'),
      aPath('tmp/git/.git/bar222'),
      aPath('tmp/.yetanotherproject/bar22'),
    ];
    let numDeleted = 0;
    const trackTotalDeleted = () => {
      numDeleted++;
    };
    const reallyDelete = true;
    const autoDeletion = false;
    const dirsToAutomaticallyDeleteFrom: VerifiedDirectoryPath[] = [];
    const interactiveDeletion = true;
    const options: HandleDuplicatesListOptions = {
      duplicatesList,
      trackTotalDeleted,
      reallyDelete,
      autoDeletion,
      interactiveDeletion,
      dirsToAutomaticallyDeleteFrom,
    };
    const myConfirmDelete = (file: string) => {
      if (file.match('git')) {
        return 'y';
      }
      return 'n';
    };

    setTestPrompt(myConfirmDelete);

    handleDuplicatesList(options);
    expect(numDeleted).toEqual(1);
    expect(exists('tmp/project/bar2')).toEqual(true);
    expect(exists('tmp/.yetanotherproject/bar22')).toEqual(true);
    expect(exists('tmp/git/.git/bar222')).toEqual(false);
    const expectedMessages = [
      [
        'Duplicates',
        [
          'tmp/project/bar2',
          'tmp/git/.git/bar222',
          'tmp/.yetanotherproject/bar22',
        ],
      ],
      ['deleting tmp/git/.git/bar222;'],
    ];
    expect(lastLogMessages(2)).toEqual(expectedMessages);
  });

  it('both automatically deletes and interactively deletes files in mixed deletion mode', () => {
    const duplicatesList = [
      aPath('tmp/project/bar2'),
      aPath('tmp/git/.git/bar222'),
      aPath('tmp/.yetanotherproject/bar22'),
      aPath('tmp/bat'),
      aPath('tmp/bim'),
    ];
    let numDeleted = 0;
    const trackTotalDeleted = () => {
      numDeleted++;
    };
    const reallyDelete = true;
    const autoDeletion = true;
    const dirsToAutomaticallyDeleteFrom =
      forceVerificationOfDirectoryPaths('tmp/project');
    const interactiveDeletion = true;
    const options: HandleDuplicatesListOptions = {
      duplicatesList,
      trackTotalDeleted,
      reallyDelete,
      autoDeletion,
      interactiveDeletion,
      dirsToAutomaticallyDeleteFrom,
    };
    const myConfirmDelete = (file: string) => {
      if (file.match('git')) {
        return 'y';
      }
      return 'n';
    };

    setTestPrompt(myConfirmDelete);
    handleDuplicatesList(options);
    expect(numDeleted).toEqual(2);
    expect(exists('tmp/project/bar2')).toEqual(false);
    expect(exists('tmp/.yetanotherproject/bar22')).toEqual(true);
    expect(exists('tmp/git/.git/bar222')).toEqual(false);
    expect(exists('tmp/bat')).toEqual(true);
    expect(exists('tmp/bim')).toEqual(true);
    const expectedMessages = [
      [
        'Duplicates',
        [
          'tmp/project/bar2',
          'tmp/git/.git/bar222',
          'tmp/.yetanotherproject/bar22',
          'tmp/bat',
          'tmp/bim',
        ],
      ],
      ['deleting tmp/project/bar2;'],
      ['deleting tmp/git/.git/bar222;'],
    ];
    expect(lastLogMessages(3)).toEqual(expectedMessages);
  });

  it('handles empty duplicates lists ', () => {
    const duplicatesList: Path[] = [];
    let numDeleted = 0;
    const trackTotalDeleted = () => {
      numDeleted++;
    };
    const reallyDelete = true;
    const autoDeletion = true;
    const dirsToAutomaticallyDeleteFrom =
      forceVerificationOfDirectoryPaths('tmp/project');
    const interactiveDeletion = false;
    const options: HandleDuplicatesListOptions = {
      duplicatesList,
      trackTotalDeleted,
      reallyDelete,
      autoDeletion,
      interactiveDeletion,
      dirsToAutomaticallyDeleteFrom,
    };
    handleDuplicatesList(options);
    expect(numDeleted).toEqual(0);
    expect(exists('tmp/project/bar2')).toEqual(true);
    expect(exists('tmp/.yetanotherproject/bar22')).toEqual(true);
    expect(exists('tmp/git/.git/bar222')).toEqual(true);
    const expectedMessages: unknown[] = [];
    expect(lastLogMessages(2)).toEqual(expectedMessages);
  });

  it('stops automatically deleting files when there is only one left', () => {
    const duplicatesList = [
      aPath('tmp/project/bar2'),
      aPath('tmp/git/.git/bar222'),
      aPath('tmp/.yetanotherproject/bar22'),
    ];
    let numDeleted = 0;
    const trackTotalDeleted = () => {
      numDeleted++;
    };
    const reallyDelete = true;
    const autoDeletion = true;
    const dirsToAutomaticallyDeleteFrom =
      forceVerificationOfDirectoryPaths('tmp');
    const interactiveDeletion = false;
    const options: HandleDuplicatesListOptions = {
      duplicatesList,
      trackTotalDeleted,
      reallyDelete,
      autoDeletion,
      interactiveDeletion,
      dirsToAutomaticallyDeleteFrom,
    };
    handleDuplicatesList(options);
    expect(numDeleted).toEqual(2);
    expect(exists('tmp/project/bar2')).toEqual(false);
    expect(exists('tmp/git/.git/bar222')).toEqual(false);
    expect(exists('tmp/.yetanotherproject/bar22')).toEqual(true);
    const expectedMessages = [
      ['deleting tmp/project/bar2;'],
      ['deleting tmp/git/.git/bar222;'],
    ];
    expect(lastLogMessages(2)).toEqual(expectedMessages);
  });

  it('interactively deletes files but not all duplicates', () => {
    const duplicatesList = [
      aPath('tmp/project/bar2'),
      aPath('tmp/git/.git/bar222'),
      aPath('tmp/.yetanotherproject/bar22'),
    ];
    let numDeleted = 0;
    const trackTotalDeleted = () => {
      numDeleted++;
    };
    const reallyDelete = true;
    const autoDeletion = false;
    const dirsToAutomaticallyDeleteFrom: VerifiedDirectoryPath[] = [];
    const interactiveDeletion = true;
    const options: HandleDuplicatesListOptions = {
      duplicatesList,
      trackTotalDeleted,
      reallyDelete,
      autoDeletion,
      interactiveDeletion,
      dirsToAutomaticallyDeleteFrom,
    };
    const myConfirmDelete = () => 'y';

    setTestPrompt(myConfirmDelete);

    handleDuplicatesList(options);
    expect(numDeleted).toEqual(2);
    expect(exists('tmp/project/bar2')).toEqual(false);
    expect(exists('tmp/git/.git/bar222')).toEqual(false);
    expect(exists('tmp/.yetanotherproject/bar22')).toEqual(true);
    const expectedMessages = [
      [
        'Duplicates',
        [
          'tmp/project/bar2',
          'tmp/git/.git/bar222',
          'tmp/.yetanotherproject/bar22',
        ],
      ],
      ['deleting tmp/project/bar2;'],
      ['deleting tmp/git/.git/bar222;'],
    ];
    expect(lastLogMessages(3)).toEqual(expectedMessages);
  });
});

describe('getHandleDuplicatesStream()', () => {
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
            bar222: '123456789',
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

  it('automatically deletes files in automatic deletion mode', async () => {
    const duplicatesLists = [
      [
        aPath('tmp/project/bar2'),
        aPath('tmp/git/.git/bar222'),
        aPath('tmp/.yetanotherproject/bar22'),
      ],
    ];
    const reallyDelete = true;
    const interactiveDeletion = false;
    const dirsToAutomaticallyDeleteFrom =
      forceVerificationOfDirectoryPaths('tmp/project');
    const stream = getHandleDuplicatesStream(
      dirsToAutomaticallyDeleteFrom,
      reallyDelete,
      interactiveDeletion
    );

    inputToWritableStream(stream, duplicatesLists);
    expect(exists('tmp/project/bar2')).toEqual(false);
    expect(exists('tmp/.yetanotherproject/bar22')).toEqual(true);
    expect(exists('tmp/git/.git/bar222')).toEqual(true);
    const expectedMessages = [
      [
        'Duplicates',
        [
          'tmp/project/bar2',
          'tmp/git/.git/bar222',
          'tmp/.yetanotherproject/bar22',
        ],
      ],
      ['deleting tmp/project/bar2;'],
    ];
    expect(lastLogMessages(2)).toEqual(expectedMessages);
  });
});
