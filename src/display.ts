// Copyright (c) 2022, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

const productionOutput = console.log;
const devOutput = () => {};
let outputFunction = productionOutput;

export const silentOutput = (): boolean => outputFunction === devOutput;

export function silenceOutput(): void {
  outputFunction = devOutput;
}

export function unSilenceOutput(): void {
  outputFunction = productionOutput
}

export function showListLengths(filesWithSizes: number, files: number): void {
  log('file list lengths:', filesWithSizes, files);
}

export function showDuplicates(duplicatesList: string[]): void {
  log('Duplicates', duplicatesList);
}

export function showTotalDeleted(totalDeleted: number): void {
  log('NUMBER OF FILES DELETED:', totalDeleted, '\n\n');
}

export function log(...values: unknown[]) {
  outputFunction(...values);
}
