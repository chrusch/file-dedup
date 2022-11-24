// Copyright (c) 2022, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {
  CandidateFilesOptions,
  getCandidateFiles,
} from '../src/get_candidate_files';
jest.mock('fs');

// tests not yet complete
const MOCK_FILE_INFO = {
  '/tmp': '',
  '/tmp/git': '',
  '/tmp/git/.git': '',
  '/tmp/git/.git/foo': 'foo content',
  '/tmp/git/.git/bar': 'bar content',
  '/tmp/project': '',
  '/tmp/project/foo': 'foo project content',
  '/tmp/project/bar': 'bar project content',
  '/tmp/another-project': '',
  '/tmp/another-project/.config': 'baz project content',
  '/tmp/another-project/.foo': 'bam project content',
};

describe('getCandidateFiles()', () => {
  const fs = require('fs');

  beforeAll(() => {
    fs.__setMockFiles(MOCK_FILE_INFO);
  });

  it('does what is expected', () => {
    const options: CandidateFilesOptions = {
      pathsToTraverse: ['/tmp/foo'],
      dirsToPossiblyDeleteFrom: ['/tmp/foo/bar'],
      exclude: [],
      includeDotfiles: false,
    };
    const got: string[] = getCandidateFiles(options);
    const expected: string[] = [];
    expect(got).toEqual(expected);
  });
});
