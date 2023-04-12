// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {deleteFile} from '../delete_file';
import {silenceOutput} from '../display';
import {aPath} from '../../common/path';
import withLocalTmpDir from 'with-local-tmp-dir';
import outputFiles from 'output-files';
import {
  exists,
  // forceVerificationOfDirectoryPaths,
  // VerifiedDirectoryPath,
} from '../../common/verified_directory_path';

describe('deleteFile()', () => {
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

  it('when reallyDelete is true, file is deleted', () => {
    const reallyDelete = true;
    const file = aPath('tmp/foo');
    deleteFile(reallyDelete, file);
    expect(exists(file)).toBe(false);
  });

  it('when reallyDelete is false, file is not deleted', () => {
    const reallyDelete = false;
    const file = aPath('tmp/baz');
    deleteFile(reallyDelete, file);
    expect(exists(file)).toBe(true);
  });
});
