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
 *
 * @remarks
 *
 * In essence, this is a simple function, but it is complicated to test in a way
 * that achieves full test coverage because its purpose is to return true only
 * when it is run in the context of a jest run. In production, it would be run
 * without parameters.
 *
 *
 * @param testReferenceError - True when testing what happens when a
 *        ReferenceError is thrown
 * @param testOtherError - True when testing what happens when any other Error
 *        is thrown
 * @param testOtherError - True when testing what happens in a non-test
 *        environment
 *
 * @returns True if we are running tests in jest, false otherwise
 *
 * @throws Any unexpected error caught within the function.
 */

export function runningJestTests(
  testReferenceError = false,
  testOtherError = false,
  testNotTEST = false
): boolean {
  try {
    if (testReferenceError) {
      throw new ReferenceError();
    }
    if (testOtherError) {
      throw new Error();
    }
    return __TEST__ && !testNotTEST ? true : false;
  } catch (e) {
    // trying to access __TEST__ when it is not defined in the global
    // scope will throw a ReferenceError. That tells us we are
    // not running jest tests.
    if (e instanceof ReferenceError) {
      return false;
    }
    throw e;
  }
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
export function getRealPath(
  pathRelativeToSrc: string,
  testProduction = false
): string {
  return runningJestTests() && !testProduction
    ? path.join(__dirname, '../../build/src/', pathRelativeToSrc)
    : path.join(__dirname, '../', pathRelativeToSrc);
}
