// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {Path} from './path';
// All console output depends on this file, this makes
// it easier to write tests that don't generated unwanted
// text.
const productionOutput = console.log;
const devOutput = () => {};
let outputFunction = productionOutput;

export const silentOutput = (): boolean => outputFunction === devOutput;

export function silenceOutput(): void {
  outputFunction = devOutput;
}

export function unSilenceOutput(): void {
  outputFunction = productionOutput;
}

export function showListLengths(filesWithSizes: number, files: number): void {
  log('file list lengths:', filesWithSizes, files);
}

export function showDuplicates(duplicatesList: Path[]): void {
  log('Duplicates', duplicatesList);
}

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

export function log(...values: unknown[]) {
  outputFunction(...values);
}
