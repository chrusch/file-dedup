// Copyright (c) 2022, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

// We are given a list like this:
// [['/etc/hosts', 'aaed732d32dbc...'], ...]
// consisting of elements that are pairs where the first item in the pair
// is the path of a file, and the second is the SHA sum of that file
//
// return an array like this:
// [[<file path>, <other file path>, ...], ]
// where each item of the array is itself an array of file paths,
// where each of those files has exatcly the same content, according
// to the SHA sum
export const getDuplicates = (allData: [string, string][]): string[][] => {
  // console.log('ALL DATA in getDuplicates', allData);

  // create a hash where they keys are SHA sums and where
  // the values are arrays of file paths, each of which files
  // correponds to the SHA sum of its key.
  const reducedData: {[shasum: string]: string[]} = {};
  allData.forEach(item => {
    reducedData[item[1]] ||= [];
    reducedData[item[1]].push(item[0]);
  });

  // we are only interested in duplicates, and so create a lists of files
  // where that have the same SHA sum as at least one other file.
  const lists: string[][] = Object.values(reducedData);
  const filteredLists: string[][] = lists.filter(
    (item: string[]) => item.length > 1
  );
  return filteredLists;
};
