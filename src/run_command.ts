// Copyright (c) 2022, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {execFile, ExecException} from 'child_process';

type StdoutHandlerFunction = (stdout: string) => void;
type ExecHandlerFunction = (
  error: ExecException | null,
  stdout: string,
  stderr: string
) => void;
type ExecHandlerGenerator = (
  stdoutHandler: StdoutHandlerFunction
) => ExecHandlerFunction;

const execHandler: ExecHandlerGenerator =
  stdoutHandler => (error, stdout, stderr) => {
    if (error) {
      throw new Error(`unexpected error running command: ${error.message}`);
    }
    if (stderr) {
      throw new Error(`unexpected stderr running command: ${stderr}`);
    }
    stdoutHandler(stdout);
  };

export function runCommand(
  command: string,
  args: string[],
  stdoutHandler: StdoutHandlerFunction
): void {
  execFile(command, args, {}, execHandler(stdoutHandler));
}
