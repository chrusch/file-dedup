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

  await Promise.all(dirs.map(dir => dirCallback(aPath(dir), getInode(dir))));
  return Array.from(files.values());
}

// files with unique sizes are certainly not duplicates
// files with non-unique sizes might be. These are the ones
// we are interested in.
export function filesWithNonUniqueSizes(
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
