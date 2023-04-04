// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {Path} from '../common/path';

// All console output depends on this file, this makes
// it easier to write tests that don't generated unwanted
// text.

const productionLog = console.log;
const productionWarn = console.warn;
export const testLogMessages: string[] = [];
export const testWarnMessages: string[] = [];
const testLog = (message: string) => {
  testLogMessages.push(message);
};
const testWarn = (message: string) => {
  testWarnMessages.push(message);
};
let standardOutput = productionLog;
let warnOutput = productionWarn;

/**
 * Returns the last *count* log messages.
 *
 * @param count - The number of log messages to return
 * @returns The last *count* log messages
 */
export function lastLogMessages(count: number) {
  return testLogMessages.splice(-count);
}

/**
 * Returns the last *count* warn messages.
 *
 * @param count - The number of warn messages to return
 * @returns The last *count* warn messages
 */
export function lastWarnMessages(count: number) {
  return testWarnMessages.splice(-count);
}

/**
 * Has this module's usual output been silenced?
 *
 * @remarks
 * Usually we use this module to log output to STDOUT, but for tests, we generally want to silence the output.
 *
 * @returns True if and only if the usual output has been silenced
 */
export const silentOutput = (): boolean => standardOutput === testLog;

/**
 * Silence the usual output of this module.
 *
 * @remarks
 * Usually we use this module to log output to STDOUT, but for tests, we generally want to silence the output. After calling this function, this module will no longer log to STDOUT.
 *
 * @returns Void;
 */
export function silenceOutput(): void {
  standardOutput = testLog;
  warnOutput = testWarn;
}

/**
 * Undo the silencing of the usual output of this module.
 *
 * @remarks
 * Usually we use this module to log output to STDOUT, but for tests, we generally want to silence the output. After calling this function, this module will log to STDOUT.
 *
 * @returns Void;
 */
export function unSilenceOutput(): void {
  standardOutput = productionLog;
  warnOutput = productionWarn;
}

/**
 * Log information about duplicates.
 *
 * @param duplicatesList - A list of file paths that represent duplicate files (files with the exact same content)
 * @returns Void;
 */
export function showDuplicates(duplicatesList: Path[]): void {
  log('Duplicates', duplicatesList);
}

/**
 * Log information about files that have been deleted (or whose deletion was simulated in a dry run)
 *
 * @param totalDeleted - The number of files deleted (or that would have been deleted if this was a dry run)
 * @param reallyDeleted - True if files were really deleted. False if this was a dry run
 * @returns Void;
 */
export function showTotalDeleted(
  totalDeleted: number,
  reallyDelete: boolean
): void {
  if (reallyDelete) {
    log(`Number of files deleted: ${totalDeleted}\n\n`);
  } else {
    log(
      `Number of files that would have been deleted with --reallyDelete: ${totalDeleted}\n\n`
    );
  }
}

/**
 * Log arbitrary values using console.log.
 *
 * @param values - Values to be logged
 * @returns Void;
 */
export function log(...values: unknown[]) {
  standardOutput(...values);
}

/**
 * Log arbitrary values using console.warn.
 *
 * @param values - Values to be logged
 * @returns Void;
 */
export function warn(...values: unknown[]) {
  warnOutput(...values);
}
