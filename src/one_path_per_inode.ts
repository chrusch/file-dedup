// Copyright (c) 2022, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

// Deal properly with hard links.
//
// Because files can have multiple hard links, one inode may be associated with
// multiple paths.
//
// We have to ensure that we consider only one path per inode, i.e. one path per
// physical file.
//
// This way, multiply hard-linked files will only be counted once. We won't
// waste time by accidentally re-hashing the same file twice, and we won't lose
// data by deleting a file as if it is a duplicate when there is in fact only
// one physical instance.
export function onePathPerInode(
  filesWithSizesAndInodes: [string, number, number][]
): [string, number][] {
  const inodesWithSizes: {[inode: number]: [string, number]} = {};
  filesWithSizesAndInodes.forEach((fileInfo: [string, number, number]) => {
    const [path, size, inode] = fileInfo;
    inodesWithSizes[inode] = [path, size];
  });
  const filesWithSizes = Object.values(inodesWithSizes);
  return filesWithSizes;
}
