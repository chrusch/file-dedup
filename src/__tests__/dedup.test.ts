// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {dedup, DedupOptions} from '../dedup';
import {silenceOutput} from '../handle_duplicates/display';
import * as remove_duplicates from '../handle_duplicates/remove_duplicates';
/* eslint-disable-next-line node/no-unpublished-import */
import {jest} from '@jest/globals'; // needed for jest.Mocked
import {forceVerificationOfDirectoryPaths} from '../common/verified_directory_path';
import {aPath} from '../common/path';
import withLocalTmpDir from 'with-local-tmp-dir';
import outputFiles from 'output-files';
import {Path} from '../common/path';

jest.mock('../handle_duplicates/remove_duplicates.ts');

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

    const getDuplicatesRet = [
      [aPath('tmp/bar'), aPath('tmp/baz'), aPath('tmp/foo')],
    ];
    const got = await dedup(options);

    expect(remove_duplicates.deleteOrListDuplicates).toHaveBeenCalledTimes(1);
    type RC = jest.Mocked<typeof remove_duplicates.deleteOrListDuplicates>;
    const call = (remove_duplicates.deleteOrListDuplicates as unknown as RC)
      .mock.calls[0];
    const firstParam: Path[][] = (call.shift() as Path[][]).map(pathArray =>
      pathArray.sort()
    );
    expect(firstParam).toEqual(expect.arrayContaining(getDuplicatesRet));
    expect(getDuplicatesRet).toEqual(expect.arrayContaining(firstParam));
    expect(call).toEqual([
      options.dirsToPossiblyDeleteFrom,
      options.reallyDelete,
      options.interactiveDeletion,
    ]);

    const expected = undefined;
    expect(got).toEqual(expected);
  });
});
