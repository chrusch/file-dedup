// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import pathModule from 'path';
import {lstatSync, readdirSync} from 'fs';
import {Path} from './path';

export function readDirectory(
  dir: Path,
  dirCallback: (dir: Path) => void,
  fileCallback: (file: Path, size: number, ino: number) => void,
  excludedNames: readonly string[],
  includeDotfiles: boolean
): void {
  const files = readdirSync(dir.path);
  files.forEach(file => {
    if (excludedNames.includes(file)) return;
    if (!includeDotfiles && file.match('^\\.')) return;

    const aPath = new Path(pathModule.join(dir.path, file));
    const pathInfo = lstatSync(aPath.path);

    if (pathInfo.isDirectory()) {
      dirCallback(aPath);
    } else if (pathInfo.isFile()) {
      fileCallback(aPath, pathInfo.size, pathInfo.ino);
    }
  });
}
