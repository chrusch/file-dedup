// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {getInode, readDirectory} from './read_directory';
import {FileWithSize} from './get_candidate_files';
import _ from 'lodash';
import {aPath, Path} from '../common/path';
import {VerifiedDirectoryPath} from '../common/verified_directory_path';
import {Transform} from 'node:stream';

export async function getFilePaths(
  dirs: VerifiedDirectoryPath[],
  excludeDirectoryNames: readonly string[],
  followSymlinks: boolean,
  includeDotfiles: boolean
): Promise<FileWithSize[]> {
  const files: Map<number, FileWithSize> = new Map();
  const directoriesRead: Set<number> = new Set();

  const fileCallback = (file: Path, size: number, inode: number): void => {
    // We are just recording information for each file.
    // We avoid recording the same files twice by using the path as the key
    // to the file information. Elsewhere in the code, we ensure that the same inode is not
    // recorded twice under two different paths.
    if (files.get(inode)) return;
    files.set(inode, [file, size]);
  };

  const dirCallback = async (dir: Path, inode: number): Promise<void> => {
    // avoid traversing the same directory twice
    if (directoriesRead.has(inode)) return;
    directoriesRead.add(inode);
    await readDirectory(
      dir,
      dirCallback,
      fileCallback,
      excludeDirectoryNames,
      followSymlinks,
      includeDotfiles
    );
  };

  await Promise.all(
    dirs.map(async dir => dirCallback(aPath(dir), await getInode(dir)))
  );
  return Array.from(files.values());
}

// files with unique sizes are certainly not duplicates
// files with non-unique sizes might be. These are the ones
// we are interested in.
export function filesWithNonUniqueSizesOld(
  filesWithSizes: FileWithSize[]
): Path[] {
  const fileSizeCount = _.countBy(filesWithSizes, '1');

  const fileWithSizeToFile = (fileWithSize: FileWithSize) =>
    _.first(fileWithSize) as Path;

  const files = _(filesWithSizes)
    .filter(([, size]) => fileSizeCount[size] > 1)
    .map(fileWithSizeToFile)
    .value();
  return files;
}

const fileSizeCount: {
  [size: number]: {firstFile: Path; count: number};
} = {};
export const filesWithNonUniqueSizesStream: Transform = new Transform({
  objectMode: true,
  transform(fileWithSize, _encoding, callback) {
    // console.log('in filesWithNonUniqueSizesStream transform');
    const [filePath, size] = fileWithSize;
    if (!fileSizeCount[size]) {
      fileSizeCount[size] = {firstFile: filePath, count: 1};
    } else {
      fileSizeCount[size].count += 1;
    }
    const count = fileSizeCount[size].count;
    if (count === 2) {
      this.push(fileSizeCount[size].firstFile);
      this.push(filePath);
    } else if (count > 2) {
      this.push(filePath);
    }
    callback();
  },
  flush(callback) {
    // console.log('in filesWithNonUniqueSizesStream flush');
    this.push(null);
    callback();
  },
  final(callback) {
    // console.log('in filesWithNonUniqueSizesStream FINAL');

    callback();
  }
});
