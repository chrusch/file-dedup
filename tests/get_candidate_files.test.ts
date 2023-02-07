// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {
  CandidateFilesOptions,
  getCandidateFiles,
} from '../src/get_candidate_files';
import {Path} from '../src/path';
import {forceVerificationOfDirectoryPaths} from '../src/verified_directory_path';
import {aPath} from '../src/path';
jest.mock('fs');

const MOCK_FILE_INFO = {
  '/tmp': [1001, 256],
  '/tmp/git': [1002, 256],
  '/tmp/git/.git': [1003, 256],
  '/tmp/git/.git/foo': [1004, 7],
  '/tmp/git/.git/bar': [1005, 8],
  '/tmp/project': [1006, 256],
  '/tmp/project/foo': [1007, 72],
  '/tmp/project/bar': [1008, 72],
  '/tmp/another-project': [1009, 256],
  '/tmp/another-project/.config': [1010, 31],
  '/tmp/another-project/.foo': [1011, 32],
};

describe('getCandidateFiles()', () => {
  const fs = require('fs');

  beforeEach(() => {
    fs.__setMockFiles(MOCK_FILE_INFO);
    // silenceOutput();
  });

  it('when given options, it returns candidate files (i.e. files with non-unique sizes)', () => {
    const options: CandidateFilesOptions = {
      pathsToTraverse: forceVerificationOfDirectoryPaths('/tmp'),
      dirsToPossiblyDeleteFrom: [],
      exclude: [],
      followSymlinks: false,
      includeDotfiles: true,
    };
    const got: Path[] = getCandidateFiles(options);
    const expected: Path[] = [
      aPath('/tmp/project/foo'),
      aPath('/tmp/project/bar'),
    ];
    expect(got).toEqual(expected);
  });
});
