// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {queue} from 'async';
import {WorkerPool} from './worker_pool';

export class PoolQueue<Input, Result> {
  public myPool;
  private workQueue;
  private processOneResult;

  constructor(
    workerThreadCodeFilePath: string,
    processOneResult: (result: Result) => void,
    poolSize: number
  ) {
    this.myPool = new WorkerPool<Input, Result>(
      workerThreadCodeFilePath,
      poolSize
    );
    this.workQueue = queue(this.sendTaskToWorkerPool.bind(this), poolSize);
    this.processOneResult = processOneResult;
  }

  async sendTaskToWorkerPool({
    jobInputData,
    resolve,
  }: {
    jobInputData: Input;
    resolve: (result: Result) => void;
  }) {
    return this.myPool.newTask(jobInputData).then(result => {
      this.processOneResult(result);
      resolve(result);
    });
  }

  addToQueue(jobInputData: Input) {
    return new Promise(resolve => {
      this.workQueue.push({jobInputData, resolve}, err => {
        if (err) {
          console.error(err);
          return;
        }
      });
    });
  }

  // shutdown the PoolQueue after using it
  async drain() {
    // I'm not sure what the next line does.
    await this.workQueue.drain();
    // this next line shuts down the worker pool, including the workers
    await this.myPool.drainAndClear();
  }
}
