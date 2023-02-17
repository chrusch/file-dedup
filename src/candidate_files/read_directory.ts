// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import pathModule from 'path';
import {Stats} from 'fs';
import {lstat, readdir, stat} from 'node:fs/promises';
import {aPath, Path} from '../common/path';
import {VerifiedDirectoryPath} from '../common/verified_directory_path';

// when path is a symlink and followSymlinks is true, returns the Stats of the
// linked file, otherwise returns the Stats of the literal file system indicated
// by path, whether file, symlink, directory, or whatever.
export async function getFileStatus(
  path: Path,
  followSymlinks: boolean
): Promise<Stats> {
  return followSymlinks ? await stat(path) : await lstat(path);
}

export async function getInode(path: VerifiedDirectoryPath): Promise<number> {
  return (await getFileStatus(aPath(path), true)).ino;
}

export async function readDirectory(
  dir: Path,
  dirCallback: (dir: Path, inode: number) => Promise<void>,
  fileCallback: (file: Path, size: number, ino: number) => void,
  excludedNames: readonly string[],
  followSymlinks: boolean,
  includeDotfiles: boolean
): Promise<void> {
  const files = await readdir(dir);
  // const dirPromises: Promise<void>[] = [];
  const filePromises = files.map(async file => {
    if (excludedNames.includes(file)) return;
    if (!includeDotfiles && file.match('^\\.')) return;

    const pth = aPath(pathModule.join(dir, file));
    const fileStatus = await getFileStatus(pth, followSymlinks);

    if (fileStatus.isDirectory()) {
      await dirCallback(pth, fileStatus.ino);
    } else if (fileStatus.isFile()) {
      fileCallback(pth, fileStatus.size, fileStatus.ino);
    } // silently ignore symlinks and other file system objects
  });
  await Promise.all(filePromises);
}
