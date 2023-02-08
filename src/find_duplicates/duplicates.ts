// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {HashData} from '../dedup';
import _ from 'lodash';
import {Path} from '../path';

type FileList = Path[];
// We are given a list like this:
//
// [['/etc/hosts', 'aaed732d32dbc...'], ...]
//
// i.e.
//
// [[<file path>, <SHA sum>], ...]
//
// And we return
//
// [[<file path, <other file path>, ...], ...]
//
// where file path are grouped by SHA sum, so that each array of file path
// consists of files with identical SHA sums, and therefore identical
// contents.
//
// All unique files are filtered out.
export const getDuplicates = (allData: Readonly<HashData>): FileList[] => {
  const transformHashDatumListToFileList = (
    hashDatumList: HashData
  ): FileList => hashDatumList.map(hashDatum => hashDatum[0]);

  const fileLists = _(allData)
    .groupBy(1)
    .values()
    .map(transformHashDatumListToFileList)
    .filter(fileList => fileList.length > 1)
    .value();

  return fileLists;
};
