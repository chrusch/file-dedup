// Copyright (c) 2022, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import fs from 'fs';

export const deleteFile = (
  reallyDelete: boolean,
  file: string,
  reportDeletion = false
) => {
  if (reallyDelete) {
    fs.unlinkSync(file);
    if (reportDeletion) console.log(`deleting ${file};`);
  } else {
    if (reportDeletion) console.log(`not deleting ${file};`);
  }
};
