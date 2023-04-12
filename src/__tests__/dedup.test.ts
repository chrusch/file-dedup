// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {dedup, DedupOptions} from '../dedup';
import {silenceOutput} from '../handle_duplicates/display';
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
      nodeHashing: false,
      pathsToTraverse: forceVerificationOfDirectoryPaths('tmp'),
      reallyDelete: true,
    };

    // const getDuplicatesRet = [
    //   [aPath('tmp/bar'), aPath('tmp/baz'), aPath('tmp/foo')],
    // ];
    const got = await dedup(options);

    const expected = undefined;
    expect(got).toEqual(expected);
  });
});
