// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import fs from 'fs';
import {log} from './display';
import {Path} from '../common/path';

/**
 * Delete a file or just pretend to delete a file.
 *
 * @param reallyDelete - Do you want to really delete the file or just pretend?
 * @param file - File to delete
 * @param reportDeletion - Log output upon deleting or pretending to delete the file
 * @returns Void
 */
export const deleteFile = (
  reallyDelete: boolean,
  file: Path,
  reportDeletion = true
): void => {
  if (reallyDelete) {
    fs.unlinkSync(file);
    if (reportDeletion) log(`Deleting ${file}`);
  } else {
    if (reportDeletion)
      log(
        `Not deleting ${file}\nUse the --reallyDelete command-line option to actually delete duplicate files.`
      );
  }
};
