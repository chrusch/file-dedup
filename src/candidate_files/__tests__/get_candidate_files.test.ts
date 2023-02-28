// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

// import {CandidateFilesOptions, getCandidateFiles} from '../get_candidate_files';
import {aPath, Path} from '../../common/path';
// import {forceVerificationOfDirectoryPaths} from '../../common/verified_directory_path';
import withLocalTmpDir from 'with-local-tmp-dir';
import outputFiles from 'output-files';

describe('getCandidateFiles()', () => {
  // const fs = require('fs');
  let resetWithLocalTmpDir: () => Promise<void>;

  beforeEach(async () => {
    resetWithLocalTmpDir = await withLocalTmpDir();
    await outputFiles({
      tmp: {
        anotherproject: {
          '.config': '123',
          '.foo': '123',
        },
        git: {
          '.git': {
            foo: 'foo',
            bar: 'bar',
          },
        },
        project: {
          foo2: '987',
          bar2: '123',
        },
        bat: '231',
        bim: '123',
      },
    });
  });

  afterEach(async () => {
    await resetWithLocalTmpDir();
  });

  it('when given options, it returns candidate files (i.e. files with non-unique sizes)', async () => {
    // const options: CandidateFilesOptions = {
    //   pathsToTraverse: forceVerificationOfDirectoryPaths('tmp'),
    //   dirsToPossiblyDeleteFrom: [],
    //   exclude: ['bim'],
    //   followSymlinks: false,
    //   includeDotfiles: false,
    // };
    // const got: Path[] = await getCandidateFiles(options);
    // got.sort();
    const got = undefined;
    const expected: Path[] = [
      aPath('tmp/bat'),
      aPath('tmp/project/bar2'),
      aPath('tmp/project/foo2'),
    ];
    expect(got).toEqual(expected);
  });
});
