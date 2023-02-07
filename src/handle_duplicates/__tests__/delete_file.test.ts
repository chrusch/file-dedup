// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {deleteFile} from '../delete_file';
import {silenceOutput} from '../display';
import {aPath} from '../../path';
jest.mock('fs');

describe('deleteFile()', () => {
  let deletedFile: string;

  beforeAll(() => {
    const fs = require('fs');
    const unlinkCallback = (path: string) => {
      deletedFile = path;
    };
    fs.setUnlinkCallback(unlinkCallback);
    silenceOutput();
  });

  beforeEach(() => {
    deletedFile = 'none';
  });

  it('when reallyDelete is true, file is deleted', () => {
    const reallyDelete = true;
    const file = aPath('/tmp/foo2');
    deleteFile(reallyDelete, file);
    expect(deletedFile).toEqual(file);
  });

  it('when reallyDelete is false, file is not deleted', () => {
    const reallyDelete = false;
    const file = aPath('/tmp/foo3');
    deleteFile(reallyDelete, file);
    expect(deletedFile).toEqual('none');
  });
});
