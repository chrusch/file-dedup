// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {HashData, HashDatum} from '../hash_file/hash_files';
import _ from 'lodash';
import {Path} from '../common/path';
import {Duplex} from 'node:stream';

type FileList = Path[];
// We are given a list like this:
//
// [['/etc/hosts', 'aaed732d32dbc...'], ...]
//
// i.e.
//
// [[<file path>, <SHA sum>], ...]
//
// And we return
//
// [[<file path, <other file path>, ...], ...]
//
// where file path are grouped by SHA sum, so that each array of file path
// consists of files with identical SHA sums, and therefore identical
// contents.
//
// All unique files are filtered out.
export const getDuplicates = (allData: Readonly<HashData>): FileList[] => {
  const transformHashDatumListToFileList = (
    hashDatumList: HashData
  ): FileList => hashDatumList.map(hashDatum => hashDatum[0]);

  const fileLists = _(allData)
    .groupBy(1)
    .values()
    .map(transformHashDatumListToFileList)
    .filter(fileList => fileList.length > 1)
    .value();

  return fileLists;
};

export function getFindDuplicatesStream(): Duplex {
  const indexByHash = new Map<string, number>();
  let currentReadIndex = 0;
  let currentWriteIndex = 0;
  const fileLists: Path[][] = [];
  const hashes: string[] = [];
  const duplicatesRead: boolean[] = [];
  const unreadDuplicates = new Set<number>();

  const nextUnreadDuplicates = (): Path[] | null => {
    const numEntries = duplicatesRead.length;
    for (let i = 0; i < numEntries; i++) {
      const index = (currentReadIndex + i) % numEntries;
      if (duplicatesRead !== undefined && duplicatesRead[index] === false) {
        duplicatesRead[index] = true;
        currentReadIndex = (index + 1) % numEntries;
        return fileLists[index];
      }
    }
    return null;
  };
  let noMoreData = false;
  let timeout: NodeJS.Timeout;
  const findDuplicatesStream = new Duplex({
    objectMode: true,
    write(chunk: HashDatum, _encoding, callback) {
      const [filename, hash] = chunk;
      const fileListIndex = indexByHash.get(hash);
      if (fileListIndex !== undefined) {
        const filesWithThisHash = fileLists[fileListIndex];
        const duplicates = [...filesWithThisHash, filename];
        fileLists[fileListIndex] = duplicates;
        duplicatesRead[fileListIndex] = false;
        unreadDuplicates.add(fileListIndex);
      } else {
        fileLists[currentWriteIndex] = [filename];
        hashes[currentWriteIndex] = hash;
        indexByHash.set(hash, currentWriteIndex);
        currentWriteIndex += 1;
      }
      callback();
    },

    // unused parameter _size
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
