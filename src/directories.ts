// Copyright (c) 2022, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import path from 'path';
import fs from 'fs';
import {readDirectory} from './read_directory';
// import {showListLengths} from './display';

// For now we always exclude these directories.
// Later we can allow the user to choose.
export const exclude = ['node_modules', '.git'];

// Returns true if the relative path indicates the same directory
// or a subdirectory of the directory it is relative to.
export const isSubdirectory = (relativePath: string): boolean =>
  relativePath === '' || !relativePath.trim().match(/^\.\./) ? true : false;

// two directories overlap if they are the same directory
// or if one directory is a subdirectory of the other
export function directoriesOverlapNotUsed(dir1: string, dir2: string): boolean {
  // sub-directory
  const r1 = path.relative(dir1, dir2);
  const r2 = path.relative(dir2, dir1);

  return isSubdirectory(r1) || isSubdirectory(r2);
}

export function getFilePaths(
  dirs: string[],
  excludeDirecoryNames: string[],
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

interface FileSizeCount {
  [size: string]: number;
}

// files with unique sizes are certainly not duplicates
// files with non-unique sizes might be. These are the ones
// we are interested in.
export function filesWithNonUniqueSizes(
  filesWithSizes: [string, number][]
): string[] {
  const fileSizeCount: FileSizeCount = {};
  // count the number of instances of each file size
  filesWithSizes.forEach(([, size]: [string, number]) => {
    if (!fileSizeCount[size]) {
      fileSizeCount[size] = 1;
    } else {
      fileSizeCount[size] += 1;
    }
  });

  const files: string[] = [];
  // make a list of files with a non-unique file size
  filesWithSizes.forEach(([filepath, size]) => {
    if (fileSizeCount[size] > 1) {
      files.push(filepath);
    }
  });
  // showListLengths(filesWithSizes.length, files.length);
  return files;
}
