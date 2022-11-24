// Copyright (c) 2022, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

//./src/tests/delete_file.test.ts
import {deleteFile} from '../src/delete_file';
jest.mock('fs');

describe('deleteFile()', () => {
  let deletedFile: string;

  beforeAll(() => {
    const fs = require('fs');
    const unlinkCallback = (path: string) => {
      deletedFile = path;
    };
    fs.setUnlinkCallback(unlinkCallback);
  });

  beforeEach(() => {
    deletedFile = 'none';
  });

  it('callback is called', () => {
    const reallyDelete = false;
    const file = '/tmp/foo';
    let count = 0;
    const callback = () => {
      count += 1;
    };
    expect(count).toEqual(0);
    deleteFile(reallyDelete, file, callback);
    expect(count).toEqual(1);
  });

  it('when reallyDelete is true, file is deleted', () => {
    const reallyDelete = true;
    const file = '/tmp/foo2';
    const callback = () => {};
    deleteFile(reallyDelete, file, callback);
    expect(deletedFile).toEqual(file);
  });

  it('when reallyDelete is false, file is not deleted', () => {
    const reallyDelete = false;
    const file = '/tmp/foo3';
    const callback = () => {};
    deleteFile(reallyDelete, file, callback);
    expect(deletedFile).toEqual('none');
  });
});
