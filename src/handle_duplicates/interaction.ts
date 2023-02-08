// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

// Here is the logic governing user input through user-interaction at runtime.
// My goal is to isolate this logic here in this module in a way that makes the
// code that depends on it thoroughly testable.

import PS from 'prompt-sync';
let prompt: PS.Prompt = PS({sigint: true});

export function confirmDelete(file: string): boolean {
  return 'y' === prompt(`Delete ${file}? ('y' deletes it) > `);
}
// this is strictly for testing
export function setTestPrompt(newPrompt: PS.Prompt) {
  prompt = newPrompt;
}
