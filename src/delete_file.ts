// Copyright (c) 2022, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import fs from 'fs';
import {log} from './display';

export const deleteFile = (
  reallyDelete: boolean,
  file: string,
  reportDeletion = true
) => {
  if (reallyDelete) {
    fs.unlinkSync(file);
    if (reportDeletion) log(`deleting ${file};`);
  } else {
    if (reportDeletion) log(`not deleting ${file};`);
  }
};
