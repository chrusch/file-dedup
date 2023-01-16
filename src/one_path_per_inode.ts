// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.
import _ from 'lodash';
import {Path} from './path';

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
export type FileWithSizeAndInode = [Path, number, number];
export type FileWithSize = [Path, number];
export function onePathPerInode(
  filesWithSizesAndInodes: FileWithSizeAndInode[]
): FileWithSize[] {
  const fileWithSizeAndInodeToFileWithSize = (
    fileWithSizeAndInode: FileWithSizeAndInode
  ) => _.take(fileWithSizeAndInode, 2) as FileWithSize;

  const takeOneFilePerInode = (
    filesWithSizesAndInodes: FileWithSizeAndInode[]
  ) => _.last(filesWithSizesAndInodes) as FileWithSizeAndInode;

  const filesWithSizes = _(filesWithSizesAndInodes)
    .groupBy(2)
    .values()
    .map(takeOneFilePerInode)
    .map(fileWithSizeAndInodeToFileWithSize)
    .value();
  return filesWithSizes;
}
