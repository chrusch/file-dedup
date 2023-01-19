// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import fs from 'fs';
import {log} from './display';
import {Path} from './path';

export const deleteFile = (
  reallyDelete: boolean,
  file: Path,
  reportDeletion = true
) => {
  if (reallyDelete) {
    fs.unlinkSync(file.path);
    if (reportDeletion) log(`deleting ${file.path};`);
  } else {
    if (reportDeletion) log(`not deleting ${file.path};`);
  }
};
