// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

// Here is the logic governing user input through user-interaction at runtime.
// My goal is to isolate this logic here in this module in a way that makes the
// code that depends on it thoroughly testable without human interaction.

import prompt from 'prompt';
import colors from '@colors/colors/safe';

/** A simplified version of the prompt object exported from the npm prompt
 module */
export type SimplePrompt = Pick<
  typeof prompt,
  'message' | 'delimiter' | 'get' | 'start'
>;

export type PromptWrapper = (
  message: string,
  /** prompt is a class */
  givenPrompt: SimplePrompt
) => Promise<string>;

const schema = {
  name: 'confirm',
  description: '',
  pattern: /^[yYnNxXqQ]?$/,
  message: 'Please reply with y for yes, n for no, or x for exit',
  default: 'n',
  required: true,
};

let started = false;

/**
 * Prompts the user for a response.
 *
 * @remarks
 *
 * Expects 'y' for yes, 'n' for no, or 'x'/'q' for exit. Accepts upper case
 * input and down-cases it.
 *
 * @param message - Text of the prompt
 * @param givenPrompt - Either prompt from the "prompt" npm module or a similar object
 * @returns The user's input
 */
export const originalPromptWrapper: PromptWrapper = async (
  message,
  givenPrompt
) => {
  givenPrompt.message = '';
  givenPrompt.delimiter = '';
  if (!started) givenPrompt.start();
  started = true;
  const description = colors.magenta(message);
  const result: {confirm: string} = await givenPrompt.get([
    {...schema, description},
  ]);
  const {confirm} = result;
  return confirm.toLowerCase();
};

export let promptWrapper: PromptWrapper = originalPromptWrapper;

/**
 * Ask user to confirm whether to delete a file.
 *
 * @param file - Name of file to delete
 * @returns True if the user has agreed to delete the file
 */
export async function confirmDelete(file: string): Promise<boolean> {
  const input = await promptWrapper(
    `Delete ${file}? ('y' deletes it) > `,
    prompt
  );
  if (input === 'x' || input === 'q') throw new Error('exit requested');
  const confirmed: boolean = input === 'y';
  return confirmed;
}

/**
 * For testing purposes, replace the default promptWrapper with one supplied
 * by the user
 *
 * @param newPrompt - A function that simulates use input
 * @returns Void
 */
export function setTestPrompt(newPrompt: PromptWrapper) {
  promptWrapper = newPrompt;
}
