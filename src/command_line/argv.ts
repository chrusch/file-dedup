// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

// Here is the logic governing user input through command-line options. My goal
// is to isolate this logic here in this module in a way that makes the code
// that depends on it thoroughly testable.

let argv = process.argv;

export function getArgv() {
  return [...argv];
}

// this is strictly for testing
export function setArgv(newArgv: string[]) {
  argv = newArgv;
}
