// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import path from 'path';
import {lstatSync, readdirSync} from 'fs';

export function readDirectory(
  dir: string,
  dirCallback: (dir: string) => void,
  fileCallback: (file: string, size: number, ino: number) => void,
  excludedNames: readonly string[],
  includeDotfiles: boolean
): void {
  const files = readdirSync(dir);
  files.forEach(file => {
    if (excludedNames.includes(file)) return;
    if (!includeDotfiles && file.match('^\\.')) return;

    const aPath = path.join(dir, file);
    const pathInfo = lstatSync(aPath);

    if (pathInfo.isDirectory()) {
      dirCallback(aPath + '/');
    } else if (pathInfo.isFile()) {
      fileCallback(aPath, pathInfo.size, pathInfo.ino);
    }
  });
}
