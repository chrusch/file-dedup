// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import path from 'path';

// a file path guaranteed to have been normalized
// I use this class instead of string to ensure that
// my values are valid, normalized file apth
export class Path {
  readonly pathString: string;

  // private to ensure no Path is created without
  // first being validated through normalization
  private constructor(myPath: string) {
    this.pathString = myPath;
  }

  public static create(pth: string) {
    return new Path(path.normalize(pth));
  }

  public static createMulti(...paths: readonly string[]) {
    return paths.map(Path.create);
  }
}
