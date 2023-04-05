// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.
import path from 'node:path';

/** Tell typescript that we expect __TEST__ to exist, even though it only
 * exists in testing mode. */
declare global {
  const __TEST__: boolean;
}

/**
 * Returns true if we are running tests in jest, false otherwise.
 */
export function isTestEnv(): boolean {
  let testEnv = true;
  try {
    testEnv = __TEST__;
  } catch (e) {
    // __TEST__ only exists at runtime when running jest tests
    if (e instanceof ReferenceError) {
      testEnv = false;
    } else {
      throw e;
    }
  }
  return testEnv;
}

/**
 * Returns the absolute path to a file relative to the src/ directory.
 *
 * @remarks
 *
 * When using worker threads, we need the path of the file with the code to run
 * in the worker thread. Computing this path depends on whether we are running
 * in production mode or in test mode.
 *
 * We need this code because __dirname is not what we would expect be when we run
 * jest tests. It refers to the directory with the original typescript code, not
 * the directory of the javascript code that is actually executing.
 *
 * @param pathRelativeToSrc - A path relative to src. So, for example, the src
 *        directory itself would be represented as '.'
 *
 * @returns The absolute path of the file
 */
export function getRealPath(pathRelativeToSrc: string): string {
  return isTestEnv()
    ? path.join(__dirname, '../../build/src/', pathRelativeToSrc)
    : path.join(__dirname, '../', pathRelativeToSrc);
}
