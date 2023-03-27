// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

/**
 * Given the output of the shasum command, return the hex hash digest.
 *
 * @remarks Expects the stdout output of the following command: shasum -a 256 <file>
 *
 * @param stdout - The stdout output of the shasum command line tool. It should look like this:
 *         "22565931f0824ddbca88c292aa5877df0ecb27de7805fd1f99745ae339894f21  myfile.txt"
 * @param args -  The arguments to shasum--used for debugging when there is an unexpected error
 * @returns A hash digest of the file hashed by shasum
 */
export function hashExtractor(stdout: string, args: readonly string[]): string {
  const found = stdout.match(/^[a-f0-9]+/);
  if (found) {
    return found[0];
  } else {
    throw new Error(
      `expected to find a hash at the beginning of the STDOUT of the shasum command, but instead found: stdout<${stdout}> args<${args}>`
    );
  }
}
