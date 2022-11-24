// Copyright (c) 2022, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {HashData} from './dedup';
import {runCommand} from './run_command';
import {hashExtractor} from './hash_extractor';
import {OnJobCompleteCallBack} from './work_queue';

export type CommandOutputHandlerType = (
  file: string,
  onTaskCompleteCallBack: OnJobCompleteCallBack,
  hashData: HashData
) => (stdout: string) => void;

export const commandOutputHandler: CommandOutputHandlerType =
  (file, onTaskCompleteCallBack, hashData) =>
  (stdout): void => {
    hashData.push([file, hashExtractor(stdout)]);
    onTaskCompleteCallBack();
  };

export function hashFile(
  file: string,
  onTaskCompleteCallBack: OnJobCompleteCallBack,
  hashData: HashData
): void {
  runCommand(
    'shasum',
    ['-a', '256', file],
    commandOutputHandler(file, onTaskCompleteCallBack, hashData)
  );
}
