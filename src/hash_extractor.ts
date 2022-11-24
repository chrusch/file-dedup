// Copyright (c) 2022, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

// ./src/hash_extractor.ts
//
// Expects the stdout output of the following command:
// shasum -a 256 <file>
// This output might look like this:
// "22565931f0824ddbca88c292aa5877df0ecb27de7805fd1f99745ae339894f21  myfile.txt"
export function hashExtractor(stdout: string): string {
  const found = stdout.match(/^[a-f0-9]+/);
  if (found) {
    return found[0];
  } else {
    throw new Error(
      `expected to find a hash at the beginning of the STDOUT of the shasum command, but instead found: ${stdout}`
    );
  }
}
