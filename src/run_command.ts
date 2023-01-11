// Copyright (c) 2022, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {execFile, ExecException} from 'child_process';

export type StdoutHandlerFunction<T> = (stdout: string) => T;
export type ExecHandlerFunction = (
  error: ExecException | null,
  stdout: string,
  stderr: string
) => void;

export type ResolveType<T> = (value: T) => void;

export const execHandler =
  <T>(
    stdoutHandler: StdoutHandlerFunction<T>,
    resolve: ResolveType<T>
  ): ExecHandlerFunction =>
  (error, stdout, stderr) => {
    if (error) {
      throw new Error(`unexpected error running command: ${error.message}`);
    }
    if (stderr) {
      throw new Error(`unexpected stderr running command: ${stderr}`);
    }
    resolve(stdoutHandler(stdout));
  };

export function runCommand<T>(
  command: string,
  args: readonly string[],
  stdoutHandler: StdoutHandlerFunction<T>
): Promise<T> {
  return new Promise(resolve => {
    execFile(command, args, {}, execHandler(stdoutHandler, resolve));
  });
}
