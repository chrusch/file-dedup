
// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {PoolQueue} from '../pool_queue';

describe('PoolQueue class', () => {
  it('does what is expected', async () => {
    const filename = '/Users/clayton/work/src/ts/file-dedup/build/src/foo.js';
    const poolSize = 15;
    const processOneResult = () => {};
    const workQueue = new PoolQueue(filename, processOneResult, poolSize);

    const mesg = 'my message ABC';
    workQueue.addToQueue(mesg);
    const mesg2 = 'my second message';
    workQueue.addToQueue(mesg2);
    // await Promise.all([item1, item2]);
    await workQueue.drain();

    expect(true).toEqual(true);
  });
});
