// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {FileWithSize} from './get_candidate_files';
import {Path} from '../common/path';
import {Transform} from 'node:stream';

/**
 * A Transform stream that takes as input files with their sizes and outputs
 * only those files that have non-unique (i.e. duplicate) sizes.
 */
export class filesWithNonUniqueSizesStream extends Transform {
  private fileSizeCount: {
    [size: number]: {firstFile: Path; count: number};
  } = {};

  /**
   * Create a filesWithNonUniqueSizesStream
   *
   * @param options - Options for the parent Transform class
   */
  constructor(options: {} = {}) {
    super({...options, objectMode: true});
  }

  /**
   * Do the work of pushing through only those files with non-unique sizes.
   *
   * @param fileWithSize - A file with its size
   * @param _encoding - Unused because this stream is in objectMode
   * @param done - Indicates that we are done processing the fileWithSize
   */
  _transform(fileWithSize: FileWithSize, _encoding: string, done: () => void) {
    const [currentFile, size] = fileWithSize;
    if (!this.fileSizeCount[size]) {
      this.fileSizeCount[size] = {firstFile: currentFile, count: 1};
    } else {
      this.fileSizeCount[size].count += 1;
    }
    const count = this.fileSizeCount[size].count;
    if (count === 2) {
      const firstFile = this.fileSizeCount[size].firstFile;
      this.push(firstFile);
      this.push(currentFile);
    } else if (count > 2) {
      this.push(currentFile);
    }
    done();
  }

  /**
   * Let the next stream in the pipeline know that no more data is coming.
   *
   * @param done - Callback used to indicate we are done.
   */
  _flush(done: () => void) {
    this.push(null);
    done();
  }

  /**
   * Placeholder function. Doesn't do anything.
   */
  _final(done: () => void) {
    done();
  }
}
