// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {HashDatum} from '../hash_file/hash_files';
import {Path} from '../common/path';
import {Duplex} from 'node:stream';

interface FileListObject {
  /** An array of paths of files with duplicate contents */
  paths: Path[];
  /** Have we read this list of duplicates in its current state? */
  duplicatesRead: boolean;
  /** Is there more than one path in the paths array? */
  duplicatesExist: boolean;
}

/**
 * Loop over an array in a circular fashion
 *
 * @param array - The array to loop over
 * @param startingIndex - The index of the given array to start at
 * @returns A generator that loops once over the given array.
 */
export function* circularArrayGenerator<T>(array: T[], startingIndex: number) {
  const numEntries = array.length;
  for (let i = 0; i < numEntries; i++) {
    const index = (startingIndex + i) % numEntries;
    yield [array[index], index] as [T, number];
  }
  return null;
}


/**
 * Returns a Duplex stream that takes filenames and corresponding hash digests
 * and outputs lists of duplicate files.
 *
 * @remarks
 *
 * Two files are considered duplicates if the contents are the same, which is to
 * say, if the hash digests of the files are identical.
 *
 * This stream attempts to be lazy, in the sense of buffering as many filenames
 * and hashes as possible before outputing any lists of duplicate files so that
 * that the lists can be as complete as possible when they are output.
 *
 * @returns A Duplex stream that takes filenames and corresponding hash digests
 * and outputs lists of duplicate files
 *
 */
export function getFindDuplicatesStream(): Duplex {
  const indexByHash = new Map<string, number>();
  let currentReadIndex = 0;
  let currentWriteIndex = -1; // to allow for prefix increment operator
  const fileLists: FileListObject[] = [];

  const nextUnreadDuplicates = (): Path[] | null => {
    const circularArray = circularArrayGenerator(fileLists, currentReadIndex);
    for (const [fileListObject, index] of circularArray) {
      if (
        fileListObject.duplicatesExist &&
        fileListObject.duplicatesRead === false
      ) {
        fileListObject.duplicatesRead = true;
        currentReadIndex = index + 1;
        return fileListObject.paths;
      }
    }
    return null;
  };

  /**
   * Record information about a file and its hash digest so that we can easily
   * look it up along with other identical copies of the file later.
   *
   * @param hashDatum - A filename and its corresponding hash digest
   * @param indexByHash - A Map that allows us to look up an array index by a hash digest value
   * @param fileLists -  A structure that accumulates information about duplicate files
   * @returns Void
   */
  function recordHashDatum(
    hashDatum: HashDatum,
    indexByHash: Map<string, number>,
    fileLists: FileListObject[]
  ) {
    const [filename, hash] = hashDatum;
    const fileListIndex = indexByHash.get(hash);
    if (fileListIndex === undefined) {
      fileLists[++currentWriteIndex] = {
        paths: [filename],
        duplicatesRead: false,
        duplicatesExist: false,
      };
      indexByHash.set(hash, currentWriteIndex);
    } else {
      const fileListObject = fileLists[fileListIndex];
      fileListObject.paths.push(filename);
      fileListObject.duplicatesRead = false;
      fileListObject.duplicatesExist = true;
    }
  }

  let noMoreData = false;
  let timeout: NodeJS.Timeout;
  const findDuplicatesStream = new Duplex({
    objectMode: true,
    write(hashDatum: HashDatum, _encoding, done) {
      recordHashDatum(hashDatum, indexByHash, fileLists);
      done();
    },

    read() {
      const pushData = () => {
        let duplicates = nextUnreadDuplicates();
        if (duplicates) {
          do {
            this.push(duplicates);
          } while ((duplicates = nextUnreadDuplicates()));
        } else if (noMoreData) {
          this.push(null);
        } else {
          if (timeout) clearInterval(timeout);
          timeout = setTimeout(pushData, 100);
        }
      };
      pushData();
    },
  });
  findDuplicatesStream.on('finish', () => {
    noMoreData = true;
  });
  return findDuplicatesStream;
}
