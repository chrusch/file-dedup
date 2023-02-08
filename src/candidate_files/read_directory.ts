// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import pathModule from 'path';
import {lstatSync, readdirSync, statSync} from 'fs';
import {aPath, Path} from '../common/path';

export function getFileStatus(path: Path, followSymlinks: boolean) {
  return followSymlinks ? statSync(path) : lstatSync(path);
}

export function readDirectory(
  dir: Path,
  dirCallback: (dir: Path) => void,
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
      dirCallback(pth);
    } else if (fileStatus.isFile()) {
      fileCallback(pth, fileStatus.size, fileStatus.ino);
    }
  });
}
