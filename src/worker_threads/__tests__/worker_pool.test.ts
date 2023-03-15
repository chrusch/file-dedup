// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {WorkerPool} from '../../worker_threads/worker_pool';

// TODO:
// * test error handling

describe('new WorkerPool()', () => {
  it('can run one job in the pool', async () => {
    const filename = '/Users/clayton/work/src/ts/file-dedup/build/src/foo.js';
    const poolSize = 15;
    const pool = new WorkerPool(filename, poolSize);
    const result = await pool.newTask('abcde');
    const expected = ['abcde', 'hashDigest'];
    expect(result).toEqual(expected);
    await pool.drainAndClear(); // shutdown workers and pool
    expect(pool.getStats()).toEqual({
      acquiredWorkerCount: 1,
      createdWorkerCount: 1,
      destroyedWorkerCount: 1,
      jobCount: 1,
      releasedWorkerCount: 1,
    });
  });

  it('can run five jobs in the pool sequentially', async () => {
    const filename = '/Users/clayton/work/src/ts/file-dedup/build/src/foo.js';
    const poolSize = 15;
    const pool = new WorkerPool(filename, poolSize);
    for (const message of ['a', 'b', 'c', 'd', 'e']) {
      const result1 = await pool.newTask(message);
      const expected1 = [message, 'hashDigest'];
      expect(result1).toEqual(expected1);
    }
    await pool.drainAndClear(); // shutdown workers and pool
    expect(pool.getStats()).toEqual({
      acquiredWorkerCount: 5,
      createdWorkerCount: 1,
      destroyedWorkerCount: 1,
      jobCount: 5,
      releasedWorkerCount: 5,
    });
  });

  it('can run five jobs in the pool in parallel', async () => {
    const filename = '/Users/clayton/work/src/ts/file-dedup/build/src/foo.js';
    const poolSize = 15;
    const pool = new WorkerPool(filename, poolSize);
    const promises: Promise<any>[] = ['a', 'b', 'c', 'd', 'e'].map(message =>
      pool.newTask(message)
    );
    expect(await Promise.all(promises)).toEqual([
      ['a', 'hashDigest'],
      ['b', 'hashDigest'],
      ['c', 'hashDigest'],
      ['d', 'hashDigest'],
      ['e', 'hashDigest'],
    ]);
    await pool.drainAndClear(); // shutdown workers and pool
    expect(pool.getStats()).toEqual({
      acquiredWorkerCount: 5,
      createdWorkerCount: 5,
      destroyedWorkerCount: 5,
      jobCount: 5,
      releasedWorkerCount: 5,
    });
  });

  it('can run five jobs in the pool partly in parallel and partly sequentially', async () => {
    const filename = '/Users/clayton/work/src/ts/file-dedup/build/src/foo.js';
    const poolSize = 3;
    const pool = new WorkerPool(filename, poolSize);
    const promises: Promise<any>[] = ['a', 'b', 'c', 'd', 'e'].map(message =>
      pool.newTask(message)
    );
    expect(await Promise.all(promises)).toEqual([
      ['a', 'hashDigest'],
      ['b', 'hashDigest'],
      ['c', 'hashDigest'],
      ['d', 'hashDigest'],
      ['e', 'hashDigest'],
    ]);
    await pool.drainAndClear(); // shutdown workers and pool
    expect(pool.getStats()).toEqual({
      acquiredWorkerCount: 5,
      createdWorkerCount: 3,
      destroyedWorkerCount: 3,
      jobCount: 5,
      releasedWorkerCount: 5,
    });
  });

  it('can run one set of jobs to completion and then run another set of jobs', async () => {
    const filename = '/Users/clayton/work/src/ts/file-dedup/build/src/foo.js';
    const poolSize = 3;
    const pool = new WorkerPool(filename, poolSize);
    const promises: Promise<any>[] = ['a', 'b', 'c', 'd', 'e'].map(message =>
      pool.newTask(message)
    );
    expect(await Promise.all(promises)).toEqual([
      ['a', 'hashDigest'],
      ['b', 'hashDigest'],
      ['c', 'hashDigest'],
      ['d', 'hashDigest'],
      ['e', 'hashDigest'],
    ]);

    const promises2: Promise<any>[] = ['a2', 'b2', 'c2', 'd2', 'e2'].map(
      message => pool.newTask(message)
    );
    expect(await Promise.all(promises2)).toEqual([
      ['a2', 'hashDigest'],
      ['b2', 'hashDigest'],
      ['c2', 'hashDigest'],
      ['d2', 'hashDigest'],
      ['e2', 'hashDigest'],
    ]);
    await pool.drainAndClear(); // shutdown workers and pool
    expect(pool.getStats()).toEqual({
      acquiredWorkerCount: 10,
      createdWorkerCount: 3,
      destroyedWorkerCount: 3,
      jobCount: 10,
      releasedWorkerCount: 10,
    });
  });

  it('throws an error when a job is submitted after drainAndClear()', async () => {
    const filename = '/Users/clayton/work/src/ts/file-dedup/build/src/foo.js';
    const poolSize = 15;
    const pool = new WorkerPool(filename, poolSize);
    const result = await pool.newTask('abcde');
    const expected = ['abcde', 'hashDigest'];
    expect(result).toEqual(expected);
    await pool.drainAndClear(); // shutdown workers and pool
    await expect(pool.newTask('abcdef')).rejects.toThrowError(
      'pool is draining and cannot accept work'
    );
  });
});
