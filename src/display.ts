// Copyright (c) 2022, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

let doOutput = true;

export function silenceOutput(): void {
  doOutput = false;
}

export function unSilenceOutput(): void {
  doOutput = true;
}

export function showListLengths(filesWithSizes: number, files: number): void {
  doOutput && console.log('file list lengths:', filesWithSizes, files);
}

export const silentOutput = () => !doOutput;
