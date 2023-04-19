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

  it('when file is in given directory, return true', async () => {
    const file = aPath('tmp/anotherproject/.config');
    const dirs: VerifiedDirectoryPath[] = forceVerificationOfDirectoryPaths(
      'tmp/anotherproject',
      'tmp/git'
    );
    const got = await fileIsInADeleteDirectory(file, dirs);
    const expected = true;
    expect(got).toEqual(expected);
  });

  it('when file is not in given directory, return false', async () => {
    const file = aPath('tmp/project/foo2');
    const dirs: VerifiedDirectoryPath[] = forceVerificationOfDirectoryPaths(
      'tmp/anotherproject',
      'tmp/git'
    );
    const got = await fileIsInADeleteDirectory(file, dirs);
    const expected = false;
    expect(got).toEqual(expected);
  });

  it('when there is no dir specified, return false', async () => {
    const file = aPath('tmp/project/foo2');
    const dirs: VerifiedDirectoryPath[] = [];
    const got = await fileIsInADeleteDirectory(file, dirs);
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

  it('automatically deletes files in automatic deletion mode', async () => {
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
    await handleDuplicatesList(options);
    expect(numDeleted).toEqual(1);
    expect(exists('tmp/project/bar2')).toEqual(false);
    expect(exists('tmp/.yetanotherproject/bar22')).toEqual(true);
    expect(exists('tmp/git/.git/bar222')).toEqual(true);
    const expectedMessages = [
      [
        'Duplicates',
        [
          'tmp/.yetanotherproject/bar22',
          'tmp/git/.git/bar222',
          'tmp/project/bar2',
        ],
      ],
      ['Deleting tmp/project/bar2'],
    ];
    expect(lastLogMessages(2)).toEqual(expectedMessages);
  });

  it('interactively deletes files in interactive deletion mode', async () => {
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
    const myConfirmDelete = async (file: string) => {
      if (file.match('git')) {
        return 'y';
      }
      return 'n';
    };

    setTestPrompt(myConfirmDelete);

    await handleDuplicatesList(options);
    expect(numDeleted).toEqual(1);
    expect(exists('tmp/project/bar2')).toEqual(true);
    expect(exists('tmp/.yetanotherproject/bar22')).toEqual(true);
    expect(exists('tmp/git/.git/bar222')).toEqual(false);
    const expectedMessages = [
      [
        'Duplicates',
        [
          'tmp/.yetanotherproject/bar22',
          'tmp/git/.git/bar222',
          'tmp/project/bar2',
        ],
      ],
      ['Deleting tmp/git/.git/bar222'],
    ];
    expect(lastLogMessages(2)).toEqual(expectedMessages);
  });

  it('both automatically deletes and interactively deletes files in mixed deletion mode', async () => {
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
    const myConfirmDelete = async (file: string) => {
      if (file.match('git')) {
        return 'y';
      }
      return 'n';
    };

    setTestPrompt(myConfirmDelete);
    await handleDuplicatesList(options);
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
          'tmp/.yetanotherproject/bar22',
          'tmp/bat',
          'tmp/bim',
          'tmp/git/.git/bar222',
          'tmp/project/bar2',
        ],
      ],
      ['Deleting tmp/project/bar2'],
      ['Deleting tmp/git/.git/bar222'],
    ];
    expect(lastLogMessages(3)).toEqual(expectedMessages);
  });

  it('handles empty duplicates lists ', async () => {
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
    await handleDuplicatesList(options);
    expect(numDeleted).toEqual(0);
    expect(exists('tmp/project/bar2')).toEqual(true);
    expect(exists('tmp/.yetanotherproject/bar22')).toEqual(true);
    expect(exists('tmp/git/.git/bar222')).toEqual(true);
    const expectedMessages: unknown[] = [];
    expect(lastLogMessages(2)).toEqual(expectedMessages);
  });

  it('stops automatically deleting files when there is only one left', async () => {
    const duplicatesList = [
      aPath('tmp/project/bar2'),
      aPath('tmp/git/.git/bar222'),
      aPath('tmp/.yetanotherproject/bar22'),
    ];
    let numDeleted = 0;
    const trackTotalDeleted = () => {
      // console.log('deleting file', file);
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
    await handleDuplicatesList(options);
    expect(numDeleted).toEqual(2);
    expect(exists('tmp/project/bar2')).toEqual(false);
    expect(exists('tmp/git/.git/bar222')).toEqual(false);
    expect(exists('tmp/.yetanotherproject/bar22')).toEqual(true);
    const expectedMessages = [
      ['Deleting tmp/project/bar2'],
      ['Deleting tmp/git/.git/bar222'],
    ];
    expect(lastLogMessages(2)).toEqual(expectedMessages);
  });

  it('interactively deletes files but not all duplicates', async () => {
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
    const myConfirmDelete = async () => 'y';

    setTestPrompt(myConfirmDelete);

    await handleDuplicatesList(options);
    expect(numDeleted).toEqual(2);
    expect(exists('tmp/project/bar2')).toEqual(false);
    expect(exists('tmp/git/.git/bar222')).toEqual(false);
    expect(exists('tmp/.yetanotherproject/bar22')).toEqual(true);
    const expectedMessages = [
      [
        'Duplicates',
        [
          'tmp/.yetanotherproject/bar22',
          'tmp/git/.git/bar222',
          'tmp/project/bar2',
        ],
      ],
      ['Deleting tmp/project/bar2'],
      ['Deleting tmp/git/.git/bar222'],
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
    await new Promise(resolve => {
      stream.on('finish', () => {
        resolve(null);
      });
    });
    expect(exists('tmp/project/bar2')).toEqual(false);
    expect(exists('tmp/.yetanotherproject/bar22')).toEqual(true);
    expect(exists('tmp/git/.git/bar222')).toEqual(true);
    const expectedMessages = [
      ['Deleting tmp/project/bar2'],
      ['Number of files deleted: 1\n\n'],
    ];
    expect(lastLogMessages(2)).toEqual(expectedMessages);
  });

  it('emits an error event when handleDuplicatesList rejects with an "exit requested" error', async () => {
    const duplicatesLists = [
      [
        aPath('tmp/project/bar2'),
        aPath('tmp/git/.git/bar222'),
        aPath('tmp/.yetanotherproject/bar22'),
      ],
    ];
    const reallyDelete = true;
    const interactiveDeletion = true;
    const dirsToAutomaticallyDeleteFrom: VerifiedDirectoryPath[] = [];

    const myConfirmDelete = async () => 'x';

    setTestPrompt(myConfirmDelete);
    const stream = getHandleDuplicatesStream(
      dirsToAutomaticallyDeleteFrom,
      reallyDelete,
      interactiveDeletion
    );

    inputToWritableStream(stream, duplicatesLists);
    await new Promise(resolve => {
      stream.on('error', err => {
        expect(err).toEqual(new Error('exit requested'));
        resolve(null);
      });
    });
    expect(exists('tmp/project/bar2')).toEqual(true);
    expect(exists('tmp/.yetanotherproject/bar22')).toEqual(true);
    expect(exists('tmp/git/.git/bar222')).toEqual(true);
    const expectedMessages: unknown[][] = [
      [
        'Duplicates',
        [
          'tmp/.yetanotherproject/bar22',
          'tmp/git/.git/bar222',
          'tmp/project/bar2',
        ],
      ],
      [
        'Duplicates',
        [
          'tmp/.yetanotherproject/bar22',
          'tmp/git/.git/bar222',
          'tmp/project/bar2',
        ],
      ],
    ];
    expect(lastLogMessages(2)).toEqual(expectedMessages);
  });

  it('emits an error event when handleDuplicatesList rejects with an error other than "exit requested"', async () => {
    const duplicatesLists = [
      [
        aPath('tmp/.yetanotherproject/bar22'),
        aPath('tmp/git/.git/bar222'),
        aPath('tmp/project/bar2'),
      ],
    ];
    const reallyDelete = true;
    const interactiveDeletion = true;
    const dirsToAutomaticallyDeleteFrom: VerifiedDirectoryPath[] = [];

    const myConfirmDelete = async () => {
      throw new Error('some other error');
    };

    setTestPrompt(myConfirmDelete);
    const stream = getHandleDuplicatesStream(
      dirsToAutomaticallyDeleteFrom,
      reallyDelete,
      interactiveDeletion
    );

    inputToWritableStream(stream, duplicatesLists);
    await new Promise(resolve => {
      stream.on('error', err => {
        expect(err).toEqual(new Error('some other error'));
        resolve(null);
      });
    });
    expect(exists('tmp/project/bar2')).toEqual(true);
    expect(exists('tmp/.yetanotherproject/bar22')).toEqual(true);
    expect(exists('tmp/git/.git/bar222')).toEqual(true);
    const expectedMessages: unknown[][] = [
      [
        'Duplicates',
        [
          'tmp/.yetanotherproject/bar22',
          'tmp/git/.git/bar222',
          'tmp/project/bar2',
        ],
      ],
      [
        'Duplicates',
        [
          'tmp/.yetanotherproject/bar22',
          'tmp/git/.git/bar222',
          'tmp/project/bar2',
        ],
      ],
    ];
    expect(lastLogMessages(2)).toEqual(expectedMessages);
  });
});
