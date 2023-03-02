// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {Readable} from 'node:stream';

export function outputOfReadableStream(stream: Readable) {
  return new Promise((resolve: (output: unknown[]) => void) => {
    const output: unknown[] = [];
    stream
      .on('data', chunk => {
        output.push(chunk);
      })
      .on('finish', () => {
        resolve(output);
      });
  });
}
