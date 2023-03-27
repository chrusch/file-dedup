// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {execFile, ExecException} from 'child_process';

/** A function that can handle the STDOUT generated by a call to execFile
 *
 * @param stdout - The STDOUT output of a call to execFile
 * @param args - The arguments to the command that produced the STDOUT output
 * @returns Arbitrary data derived from stdout
 */
export type StdoutHandlerFunction<T> = (
  stdout: string,
  args: readonly string[]
) => T;

/**
 * A function that can be used as a callback to execFile
 *
 * @param error - An Error object generated from a call to execFile
 * @param stdout - The STDOUT generated from a call to execFile
 * @param stderr - Error text generated from a call to execFile
 * @returns void
 */
export type ExecHandlerFunction = (
  error: ExecException | null,
  stdout: string,
  stderr: string
) => void;

export type ResolveType<T> = (value: T) => void;
export type RejectType = (error: Error) => void;

/**
 * Constructs a callback function for child_process.execFile
 *
 * @param stdoutHandler - The handler function of the command's STDOUT
 * @param args - The arguments that the command takes, used for debugging when there is an unexpected error
 * @param resolve - The callback that accepts the output of stdoutHandler when the command is successful
 * @param reject - The callback that accepts the error when the command fails
 * @returns A Promise that resolves to the output of stdoutHandler
 */
export const execHandler =
  <T>(
    stdoutHandler: StdoutHandlerFunction<T>,
    args: readonly string[],
    resolve: ResolveType<T>,
    reject: RejectType
  ): ExecHandlerFunction =>
  (error, stdout, stderr) => {
    if (error) {
      reject(
        new Error(
          `unexpected error running command: ${error.message} stderr<${stderr}> stdout<${stdout}> args: <${args}>`
        )
      );
      return;
    }
    if (stderr) {
      reject(
        new Error(
          `unexpected stderr running command: <${stderr}> args: <${args}>`
        )
      );
      return;
    }
    resolve(stdoutHandler(stdout, args));
  };

/**
 * Run a command with arguments and run a handler on the STDOUT ouput.
 *
 * @param command - The path to the command to run
 * @param args - The arguments that the command takes
 * @param stdoutHandler - The handler function of the command's STDOUT
 * @returns A Promise that resolves to the output of stdoutHandler
 */
export function runCommand<T>(
  command: string,
  args: readonly string[],
  stdoutHandler: StdoutHandlerFunction<T>
): Promise<T> {
  // console.log('running command', command, args);
  return new Promise((resolve, reject) => {
    execFile(
      command,
      args,
      {},
      execHandler(stdoutHandler, args, resolve, reject)
    );
  });
}
