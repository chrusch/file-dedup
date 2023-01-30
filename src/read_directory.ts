// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import pathModule from 'path';
import {lstatSync, readdirSync, statSync} from 'fs';
import {Path} from './path';

export function getFileStatus(path: Path, followSymlinks: boolean) {
  return followSymlinks ? statSync(path.path) : lstatSync(path.path);
}

export function readDirectory(
  dir: Path,
  dirCallback: (dir: Path) => void,
  fileCallback: (file: Path, size: number, ino: number) => void,
  excludedNames: readonly string[],
  followSymlinks: boolean,
  includeDotfiles: boolean
): void {
  const files = readdirSync(dir.path);
  files.forEach(file => {
    if (excludedNames.includes(file)) return;
    if (!includeDotfiles && file.match('^\\.')) return;

    const aPath = new Path(pathModule.join(dir.path, file));
    const fileStatus = getFileStatus(aPath, followSymlinks);

    if (fileStatus.isDirectory()) {
      dirCallback(aPath);
    } else if (fileStatus.isFile()) {
      fileCallback(aPath, fileStatus.size, fileStatus.ino);
    }
  });
}
