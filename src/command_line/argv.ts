// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

/** We want to test how the code responds to different command line arguments
 * wwithout actually invoking the whole program on the command line. The code in
 * this module allows us to do this.
 */

/** Capture the command line arguments used to invoke this program. */
let argv = process.argv;

/** Return the command line arguments. */
export function getArgv() {
  return [...argv];
}

/** Set the command line arguments for testing purposes. */
export function setArgv(newArgv: string[]) {
  argv = newArgv;
}
