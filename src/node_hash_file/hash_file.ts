// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

// node:crypto seems to work faster than CryptoJS, possibly because it is easier
// to hash a binary buffer.
// import CryptoJS from 'crypto-js';
import {createHash} from 'node:crypto';
import {readFileInChunks} from './read_file_in_chunks';

/**
 * Returns the hash digest of a file using the node:crypto library.
 *
 * @param filename - The path to the file to be hashed
 * @returns A promise resolving to the hex hash digest of the file
 */
export function getSHA256HashDigest(filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // const sha256 = CryptoJS.algo.SHA256.create();
    const sha256 = createHash('sha256');

    const onChunk = (chunk: Buffer) => {
      // sha256.update(CryptoJS.enc.Latin1.parse(chunk.toString('latin1')));
      sha256.update(chunk);
    };

    const onDone = () => {
      // const hash = sha256.finalize();
      // const hashHex = hash.toString(CryptoJS.enc.Hex);
      const hashHex = sha256.digest('hex');
      resolve(hashHex);
    };

    const onError = (err: Error) => {
      if (err) {
        reject(err);
      } else {
        onDone();
      }
    };

    readFileInChunks(filename, onChunk, onError, onDone);
  });
}
