// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {dedup, DedupOptions} from '../dedup';
import {lastLogMessages, silenceOutput} from '../handle_duplicates/display';
import {setTestPrompt} from '../handle_duplicates/interaction';
import {forceVerificationOfDirectoryPaths} from '../common/verified_directory_path';
import withLocalTmpDir from 'with-local-tmp-dir';
import outputFiles from 'output-files';

describe('dedup()', () => {
  beforeAll(() => {
    silenceOutput();
  });

  let resetWithLocalTmpDir: () => Promise<void>;

  beforeEach(async () => {
    resetWithLocalTmpDir = await withLocalTmpDir();
    await outputFiles({
      tmp: {
        bar: '123',
        baz: '123',
        foo: '123',
        tmp: {
          zoo: '1234',
        },
      },
    });
  });

  afterEach(async () => {
    await resetWithLocalTmpDir();
  });

  it('calls certain functions with expected args and returns a void promise', async () => {
    const options: DedupOptions = {
      dirsToPossiblyDeleteFrom: forceVerificationOfDirectoryPaths('tmp/tmp'),
      exclude: [],
      followSymlinks: false,
      includeDotfiles: false,
      interactiveDeletion: false,
      commandLineHashing: true,
      pathsToTraverse: forceVerificationOfDirectoryPaths('tmp'),
      reallyDelete: true,
    };

    const got = await dedup(options);
    const expectedMessages = [
      ['Duplicates', ['tmp/bar', 'tmp/baz', 'tmp/foo']],
      ['Number of files deleted: 0\n\n'],
      ['Done!'],
    ];
    expect(lastLogMessages(4)).toEqual(expectedMessages);

    const expected = undefined;
    expect(got).toEqual(expected);
  });

  it('exits nicely when exit is requested by the user', async () => {
    const options: DedupOptions = {
      dirsToPossiblyDeleteFrom: forceVerificationOfDirectoryPaths('tmp/tmp'),
      exclude: [],
      followSymlinks: false,
      includeDotfiles: false,
      interactiveDeletion: true,
      commandLineHashing: true,
      pathsToTraverse: forceVerificationOfDirectoryPaths('tmp'),
      reallyDelete: true,
    };
    const myConfirmDelete = async () => 'x';

    setTestPrompt(myConfirmDelete);

    const got = await dedup(options);
    const expectedMessages = [
      ['Duplicates', ['tmp/bar', 'tmp/baz', 'tmp/foo']],
      ['Exiting'],
    ];
    expect(lastLogMessages(2)).toEqual(expectedMessages);

    const expected = undefined;
    expect(got).toEqual(expected);
  });
});
