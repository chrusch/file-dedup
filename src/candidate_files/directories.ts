// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {FileWithSize} from './get_candidate_files';
import {Path} from '../common/path';
import {Transform} from 'node:stream';

export class filesWithNonUniqueSizesStream extends Transform {
  private fileSizeCount: {
    [size: number]: {firstFile: Path; count: number};
  } = {};
  constructor(options: {} = {}) {
    super({...options, objectMode: true});
  }

  _transform(
    fileWithSize: FileWithSize,
    _encoding: string,
    callback: () => void
  ) {
    const [filePath, size] = fileWithSize;
    if (!this.fileSizeCount[size]) {
      this.fileSizeCount[size] = {firstFile: filePath, count: 1};
    } else {
      this.fileSizeCount[size].count += 1;
    }
    const count = this.fileSizeCount[size].count;
    if (count === 2) {
      this.push(this.fileSizeCount[size].firstFile);
      this.push(filePath);
    } else if (count > 2) {
      this.push(filePath);
    }
    callback();
  }

  _flush(callback: () => void) {
    this.push(null);
    callback();
  }

  _final(callback: () => void) {
    callback();
  }
}
