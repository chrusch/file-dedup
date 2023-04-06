// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {hashAllCandidateFilesWithShasumCommand} from '../shasum_hash_stream';
import {commandExists} from '../hash_files';
import {aPath} from '../../common/path';
// import * as runCommand from '../run_command';
// /* eslint-disable-next-line node/no-unpublished-import */
// import {jest} from '@jest/globals'; // needed for jest.Mocked to work
// import {aPath} from '../../common/path';

// jest.mock('../run_command.ts');
// jest.mock('fs');
// describe('hashFile()', () => {
//   it('when called, calls runCommand with expected arguments', async () => {
//     const file = aPath('/tmp/foo');
//     const cmd = aPath('shasum');
//     const got = await hashFile(file, cmd);
//     const expected = undefined;
//     expect(got).toEqual(expected);
//     expect(runCommand.runCommand).toHaveBeenCalledTimes(1);
//     expect(runCommand.runCommand).toHaveReturnedTimes(1);
//     type RC = jest.Mocked<typeof runCommand.runCommand>;
//     const call = (runCommand.runCommand as unknown as RC).mock.calls[0];
//     expect(call[0]).toEqual('shasum');
//     expect(call[1]).toEqual(['-a', '256', file]);
//     expect(typeof call[2]).toEqual('function');
//     expect(call[2]('abcd /tmp/cc', [])).toEqual([file, 'abcd']);
//   });
// });
//
import {outputOfDuplexStreamWithInput} from '../../__tests__/test_utilities';
import withLocalTmpDir from 'with-local-tmp-dir';
import outputFiles from 'output-files';
import {chmod} from 'fs/promises';

describe('hashAllCandidateFilesWithShasumCommand()', () => {
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

  it('returns a stream that can be used to hash files', async () => {
    const command = await commandExists('shasum');
    const concurrency = 2;
    const stream = hashAllCandidateFilesWithShasumCommand(
      aPath(command),
      concurrency
    );
    const input = [
      'tmp/anotherproject/.config',
      'tmp/git/.git/bar',
      'tmp/project/bar2',
      'tmp/.yetanotherproject/bar22',
    ];
    const got = await outputOfDuplexStreamWithInput(stream, input);
    const expected = [
      [
        'tmp/.yetanotherproject/bar22',
        '15e2b0d3c33891ebb0f1ef609ec419420c20e320ce94c65fbc8c3312448eb225',
      ],
      [
        'tmp/anotherproject/.config',
        '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
      ],
      [
        'tmp/git/.git/bar',
        'e0f112837b00ca52bcc7c31c8e6fd718d50449b090b7fe50a0d3772473b6e5d8',
      ],
      [
        'tmp/project/bar2',
        '15e2b0d3c33891ebb0f1ef609ec419420c20e320ce94c65fbc8c3312448eb225',
      ],
    ];
    const gotSorted = got.sort((a, b) =>
      (a as [string])[0].localeCompare((b as [string])[0] as string)
    );
    expect(gotSorted).toEqual(expected);
  });

  it('deals smoothly with unreadable files', async () => {
    const command = await commandExists('shasum');
    const concurrency = 2;
    const stream = hashAllCandidateFilesWithShasumCommand(
      aPath(command),
      concurrency
    );
    const input = [
      'tmp/anotherproject/.config',
      'tmp/git/.git/bar',
      'tmp/project/bar2',
      'tmp/.yetanotherproject/bar22',
    ];
    await chmod('tmp/anotherproject/.config', 0o000);
    const got = await outputOfDuplexStreamWithInput(stream, input);
    const expected = [
      [
        'tmp/.yetanotherproject/bar22',
        '15e2b0d3c33891ebb0f1ef609ec419420c20e320ce94c65fbc8c3312448eb225',
      ],
      [
        'tmp/git/.git/bar',
        'e0f112837b00ca52bcc7c31c8e6fd718d50449b090b7fe50a0d3772473b6e5d8',
      ],
      [
        'tmp/project/bar2',
        '15e2b0d3c33891ebb0f1ef609ec419420c20e320ce94c65fbc8c3312448eb225',
      ],
    ];
    const gotSorted = got.sort((a, b) =>
      (a as [string])[0].localeCompare((b as [string])[0] as string)
    );
    expect(gotSorted).toEqual(expected);
  });

  it('deals smoothly with non-existent files', async () => {
    const command = await commandExists('shasum');
    const concurrency = 2;
    const stream = hashAllCandidateFilesWithShasumCommand(
      aPath(command),
      concurrency
    );
    const input = [
      'tmp/anotherproject/.config',
      'tmp/git/.git/non-existent',
      'tmp/project/bar2',
      'tmp/.yetanotherproject/bar22',
    ];
    await chmod('tmp/anotherproject/.config', 0o000);
    const got = await outputOfDuplexStreamWithInput(stream, input);
    const expected = [
      [
        'tmp/.yetanotherproject/bar22',
        '15e2b0d3c33891ebb0f1ef609ec419420c20e320ce94c65fbc8c3312448eb225',
      ],
      [
        'tmp/project/bar2',
        '15e2b0d3c33891ebb0f1ef609ec419420c20e320ce94c65fbc8c3312448eb225',
      ],
    ];
    const gotSorted = got.sort((a, b) =>
      (a as [string])[0].localeCompare((b as [string])[0] as string)
    );
    expect(gotSorted).toEqual(expected);
  });
});
