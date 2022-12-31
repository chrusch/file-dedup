// Copyright (c) 2022, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import PS from 'prompt-sync';
const prompt = PS({sigint: true});

export function confirmDelete(file: string): boolean {
  return 'y' === prompt(`Delete ${file}? ('y' deletes it) > `);
}
