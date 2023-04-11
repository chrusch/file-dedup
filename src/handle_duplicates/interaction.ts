// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

// Here is the logic governing user input through user-interaction at runtime.
// My goal is to isolate this logic here in this module in a way that makes the
// code that depends on it thoroughly testable without human interaction.

import PS from 'prompt-sync';
type SimplePrompt = (msg: string) => string;
let prompt: SimplePrompt = PS({sigint: true});

/**
 * Ask user to confirm whether to delete a file.
 *
 * @param file - Name of file to delete
 * @returns True if the user has agreed to delete the file
 */
export function confirmDelete(file: string): boolean {
  return 'y' === prompt(`Delete ${file}? ('y' deletes it) > `);
}
/**
 * For testing purposes, replace the user prompt function.
 *
 * @param newPrompt - A function that simulates use input
 * @returns Void
 */
export function setTestPrompt(newPrompt: SimplePrompt) {
  prompt = newPrompt;
}
