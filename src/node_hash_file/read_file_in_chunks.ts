// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import fs from 'fs';

export function readFileInChunks(
  filePath: string,
  onChunk: (data: Buffer, offs: number, total: number) => void,
  onError: (error: NodeJS.ErrnoException) => void,
  onDone: () => void
) {
  const CHUNK_SIZE = 5 * 1024 * 1024;
  const buffer = Buffer.alloc(CHUNK_SIZE);

  fs.open(filePath, 'r', (err, fd) => {
    if (err) {
      onError(err);
      throw err;
    }

    let offs = 0;
    const readNextChunk = () => {
      offs += 1;
      fs.read(fd, buffer, 0, CHUNK_SIZE, null, (err, nread) => {
        if (err) throw err;

        // none read--file complete
        if (nread === 0) {
          // done reading file, do any necessary finalization steps
          onDone();

          fs.close(fd, err => {
            if (err) throw err;
          });

          return;
        }

        // some read
        let data: Buffer;
        if (nread < CHUNK_SIZE) {
          data = buffer.slice(0, nread);
        } else {
          data = buffer;
        }
        onChunk(data, offs, offs);
        readNextChunk();
      });
    };

    readNextChunk();
  });
}
