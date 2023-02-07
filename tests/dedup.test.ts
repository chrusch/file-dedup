// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {dedup, DedupOptions} from '../src/dedup';
import {silenceOutput} from '../src/display';
import * as gcf from '../src/candidate_files/get_candidate_files';
import * as hash_file from '../src/hash_files';
import * as rd from '../src/remove_duplicates';
/* eslint-disable-next-line node/no-unpublished-import */
import {jest} from '@jest/globals'; // needed for jest.Mocked
import {forceVerificationOfDirectoryPaths} from '../src/verified_directory_path';
import {aPath} from '../src/path';

jest.mock('../src/candidate_files/get_candidate_files.ts');
jest.mock('../src/hash_files.ts');
jest.mock('../src/remove_duplicates.ts');
jest.mock('fs');

describe('dedup()', () => {
  beforeAll(() => {
    silenceOutput();
  });
  it('calls certain functions with expected args and returns a void promise', async () => {
    const options: DedupOptions = {
      dirsToPossiblyDeleteFrom:
        forceVerificationOfDirectoryPaths('/tmp/tmp/foo'),
      exclude: [],
      followSymlinks: false,
      includeDotfiles: false,
      interactiveDeletion: false,
      pathsToTraverse: forceVerificationOfDirectoryPaths('/tmp'),
      reallyDelete: true,
    };
    type GCF = jest.Mocked<typeof gcf.getCandidateFiles>;
    (gcf.getCandidateFiles as GCF).mockReturnValue([
      aPath('/tmp/foo'),
      aPath('/tmp/bar'),
      aPath('/tmp/baz'),
    ]);
    type HashFile = jest.Mocked<typeof hash_file.hashFile>;
    (hash_file.hashFile as HashFile).mockImplementation(_file => {
      return Promise.resolve([_file, 'abcd']);
    });

    const getDuplicatesRet = [
      [aPath('/tmp/foo'), aPath('/tmp/bar'), aPath('/tmp/baz')],
    ];
    const got = await dedup(options);

    expect(gcf.getCandidateFiles).toHaveBeenCalledTimes(1);
    expect(gcf.getCandidateFiles).toHaveBeenNthCalledWith(1, options);

    expect(hash_file.hashFile).toHaveBeenCalledTimes(3);

    expect(rd.deleteOrListDuplicates).toHaveBeenCalledTimes(1);
    expect(rd.deleteOrListDuplicates).toHaveBeenCalledWith(
      getDuplicatesRet,
      options.dirsToPossiblyDeleteFrom,
      options.reallyDelete,
      options.interactiveDeletion
    );

    const expected = undefined;
    expect(got).toEqual(expected);
  });
});
