// Copyright (c) 2022, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

// Here is the logic governing user input, either through command-line options
// or through user-interaction during execution. My goal is to isolate this
// logic here in this module in a way that makes the code that depends on it
// thoroughly testable.

import PS from 'prompt-sync';
let prompt: PS.Prompt = PS({sigint: true});
let argv = process.argv;

export function confirmDelete(file: string): boolean {
  return 'y' === prompt(`Delete ${file}? ('y' deletes it) > `);
}

export function getArgv() {
  return [...argv];
}

// this is strictly for testing
export function setTestPrompt(newPrompt: PS.Prompt) {
  prompt = newPrompt;
}

// this is strictly for testing
export function setArgv(newArgv: string[]) {
  argv = newArgv;
}
