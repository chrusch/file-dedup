// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import pathModule from 'path';
import {lstatSync, readdirSync, statSync, Stats} from 'fs';
import {aPath, Path} from '../common/path';
import {VerifiedDirectoryPath} from '../common/verified_directory_path';

// when path is a symlink and followSymlinks is true, returns the Stats of the
// linked file, otherwise returns the Stats of the literal file system indicated
// by path, whether file, symlink, directory, or whatever.
export function getFileStatus(path: Path, followSymlinks: boolean): Stats {
  return followSymlinks ? statSync(path) : lstatSync(path);
}

export function getInode(path: VerifiedDirectoryPath): number {
  return getFileStatus(aPath(path), true).ino;
}

export function readDirectory(
  dir: Path,
  dirCallback: (dir: Path, inode: number) => void,
  fileCallback: (file: Path, size: number, ino: number) => void,
  excludedNames: readonly string[],
  followSymlinks: boolean,
  includeDotfiles: boolean
): void {
  const files = readdirSync(dir);
  files.forEach(file => {
    if (excludedNames.includes(file)) return;
    if (!includeDotfiles && file.match('^\\.')) return;

    const pth = aPath(pathModule.join(dir, file));
    const fileStatus = getFileStatus(pth, followSymlinks);

    if (fileStatus.isDirectory()) {
      dirCallback(pth, fileStatus.ino);
    } else if (fileStatus.isFile()) {
      fileCallback(pth, fileStatus.size, fileStatus.ino);
    } // silently ignore symlinks and other file system objects
  });
}
