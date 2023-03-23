// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {execFile, ExecException} from 'child_process';

export type StdoutHandlerFunction<T> = (
  stdout: string,
  args: readonly string[]
) => T;
export type ExecHandlerFunction = (
  error: ExecException | null,
  stdout: string,
  stderr: string
) => void;

export type ResolveType<T> = (value: T) => void;
export type RejectType = (error: Error) => void;

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
