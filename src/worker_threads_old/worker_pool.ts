// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import genericPool from 'generic-pool';
import {makeOneWorkerThreadNoAutoExit} from './worker_thread_utilities';
import {Worker} from 'node:worker_threads';

interface PromiseObject<T> {
  resolve: (value: T) => void;
  reject: () => void;
}

export class WorkerPool<Input, Result> {
  private readonly genericPool: genericPool.Pool<Worker>;
  private currentJobId: number = 0;
  private workerMap: Map<number, Worker>;
  private promiseMap: Map<number, PromiseObject<Result>>;
  private createdWorkerCount = 0;
  private destroyedWorkerCount = 0;
  private acquiredWorkerCount = 0;
  private releasedWorkerCount = 0;

  constructor(workerThreadCodeFilePath: string, poolSize: number) {
    this.genericPool = this.getGenericPool(
      workerThreadCodeFilePath,
      poolSize,
      this.processOneResult.bind(this)
    );
    this.workerMap = new Map<number, Worker>();
    this.promiseMap = new Map<number, PromiseObject<Result>>();
  }

  private getGenericPool<T>(
    workerThreadCodeFilePath: string,
    poolSize: number,
    processOneResult: ({jobId, result}: {jobId: number; result: T}) => void
  ) {
    const factory = {
      create: () => {
        this.createdWorkerCount += 1;
        return Promise.resolve(
          makeOneWorkerThreadNoAutoExit(
            workerThreadCodeFilePath,
            processOneResult
          )
        );
      },
      destroy: (worker: Worker) => {
        this.destroyedWorkerCount += 1;
        // console.log(
        //   'calling worker shutdown from within pool destroy function'
        // );
        worker.emit('shutdown');
        return Promise.resolve();
      },
    };

    const opts = {
      max: poolSize, // maximum size of the pool
      min: 1, // minimum size of the pool
    };
    return genericPool.createPool(factory, opts);
  }

  public getStats() {
    return {
      acquiredWorkerCount: this.acquiredWorkerCount,
      createdWorkerCount: this.createdWorkerCount,
      destroyedWorkerCount: this.destroyedWorkerCount,
      jobCount: this.currentJobId,
      releasedWorkerCount: this.releasedWorkerCount,
    };
  }

  private getJobId() {
    return (this.currentJobId += 1);
  }

  private processOneResult({jobId, result}: {jobId: number; result: Result}) {
    const promiseObject = this.promiseMap.get(jobId);
    this.promiseMap.delete(jobId);
    if (promiseObject) {
      const {resolve, reject: _reject} = promiseObject;
      resolve(result);
    } else {
      throw new Error(
        `expected to find mapped promise object for jobId ${jobId}`
      );
    }
    const res = this.workerMap.get(jobId);
    this.workerMap.delete(jobId);
    if (res) {
      this.releasedWorkerCount += 1;
      this.genericPool.release(res);
    } else {
      throw new Error(`expected to find mapped worker for jobId ${jobId}`);
    }
  }

  public async newTask(jobInputData: Input): Promise<Result> {
    let res: Worker;
    try {
      res = await this.genericPool.acquire();
    } catch (error) {
      // There may be an error drain() has been called on the pool
      throw error;
    }
    this.acquiredWorkerCount += 1;
    const jobId = this.getJobId();
    res.postMessage({jobId: jobId, workerInput: jobInputData});
    this.workerMap.set(jobId, res);
    const resultPromise: Promise<Result> = new Promise((resolve, reject) => {
      this.promiseMap.set(jobId, {resolve, reject});
    });
    return resultPromise;
  }

  // call this when you want to shut down the pool and all its workers
  public async drainAndClear() {
    await this.genericPool.drain();
    await this.genericPool.clear();
  }
}
