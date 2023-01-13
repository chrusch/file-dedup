// Copyright (c) 2022, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import path from 'path';
import fs from 'fs';
import {readDirectory} from './read_directory';
import {FileWithSize} from './one_path_per_inode';
import _ from 'lodash';

// For now we always exclude these directories.
// Later we can allow the user to choose.
export const exclude = ['node_modules', '.git'];

// Returns true if the relative path indicates the same directory
// or a subdirectory of the directory it is relative to.
export const isSubdirectory = (relativePath: string): boolean =>
  relativePath === '' || !relativePath.trim().match(/^\.\./) ? true : false;

export function getFilePaths(
  dirs: readonly string[],
  excludeDirecoryNames: readonly string[],
  includeDotfiles: boolean
): [string, number, number][] {
  const files: {[filepath: string]: [string, number, number]} = {};
  const directoriesRead: {[path: string]: true} = {};

  const fileCallback = (file: string, size: number, inode: number): void => {
    // We are just recording information for each file.
    // We avoid recording the same files twice by using the filename as the key
    // of an object. Elsewhere in the code, we ensure that the same inode is not
    // recorded twice under two different paths.
    files[file] = [file, size, inode];
  };

  const dirCallback = (dir: string): void => {
    // avoid traversing the same directory twice
    if (directoriesRead[dir]) return;
    directoriesRead[dir] = true;
    readDirectory(
      dir,
      dirCallback,
      fileCallback,
      excludeDirecoryNames,
      includeDotfiles
    );
  };

  dirs.forEach(dir => dirCallback(dir));
  return Object.values(files);
}

// Is file in dir or a subdirectory of dir?
export const fileIsInDirectoryOrSubdirectory = (
  file: string,
  dir: string
): boolean => {
  const realFilePath: string = fs.realpathSync(file);
  const realDirPath: string = fs.realpathSync(dir);
  const relativePath: string = path.relative(realDirPath, realFilePath);
  return isSubdirectory(relativePath);
};

// files with unique sizes are certainly not duplicates
// files with non-unique sizes might be. These are the ones
// we are interested in.
export function filesWithNonUniqueSizes(
  filesWithSizes: FileWithSize[]
): string[] {
  const fileSizeCount = _.countBy(filesWithSizes, '1');

  const fileWithSizeToFile = (fileWithSize: FileWithSize) =>
    _.first(fileWithSize) as string;

  const files = _(filesWithSizes)
    .filter(([, size]) => fileSizeCount[size] > 1)
    .map(fileWithSizeToFile)
    .value();
  return files;
}
