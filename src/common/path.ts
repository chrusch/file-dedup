// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

/** A simple string that represents a file path but that is branded in
 * typescript's type system as a Path entity */
export type Path = string & {
  _brand: 'Path';
};

/** convert a string into a Path */
export function aPath(givenPath: string): Path {
  return givenPath as Path;
}
