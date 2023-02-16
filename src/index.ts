// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {main} from './main';

async function exitWhenPromiseCompletes(entryPoint: () => Promise<void>) {
  const pollTime = 1000 * 1000 * 1000;
  const interval = setInterval(() => {}, pollTime);

  return entryPoint().finally(() => {
    clearInterval(interval);
  });
}

exitWhenPromiseCompletes(main);
