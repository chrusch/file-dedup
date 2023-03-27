// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import fs from 'fs';

/**
 * Read a potentially very large file in manageable chunks.
 *
 * @param filePath - Path to file to be read
 * @param onChunk - Callback that accepts binary data from file
 * @param onError - Callback to handle any errors
 * @param onDone - Callback to let caller know the reading is complete
 * @returns Void
 */
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

        // no data read--file complete
        if (nread === 0) {
          // done reading file, do any necessary finalization steps
          onDone();

          fs.close(fd, err => {
            if (err) throw err;
          });

          return;
        }

        // some data read
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
