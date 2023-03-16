// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {Worker} from 'worker_threads';
import {ErrorCallback, QueueObject, queue} from 'async';

interface Task<T> {
  data: T;
  worker: WorkerWithBusy;
  callback: (error?: Error | null, result?: any) => void;
}

class WorkerWithBusy extends Worker {
  public isBusy: boolean = false;
}

class WorkerPool {
  private readonly workers: WorkerWithBusy[] = [];

  constructor(
    private readonly maxWorkers: number,
    private readonly workerPath: string
  ) {}

  private createWorker(): WorkerWithBusy {
    const worker: WorkerWithBusy = new WorkerWithBusy(this.workerPath);
    worker.isBusy = false;

    worker.once('exit', () => {
      const index = this.workers.indexOf(worker);
      if (index !== -1) {
        this.workers.splice(index, 1);
      }
    });

    this.workers.push(worker);
    return worker;
  }

  public getAvailableWorker(): WorkerWithBusy | null {
    for (const worker of this.workers) {
      if (!worker.isBusy) {
        worker.isBusy = true;
        return worker;
      }
    }

    if (this.workers.length < this.maxWorkers) {
      const worker = this.createWorker();
      worker.isBusy = true;
      return worker;
    }

    return null;
  }

  releaseWorker(worker: WorkerWithBusy): void {
    worker.isBusy = false;
  }

  terminateAllWorkers(): void {
    for (const worker of this.workers) {
      worker.terminate();
    }

    this.workers.length = 0;
  }
}

function createQueue<T>(
  maxWorkers: number,
  workerPath: string,
  workerDataMapper: (task: T) => any,
  resultMapper: (result: any) => any
): QueueObject<Task<T>> {
  const workerPool = new WorkerPool(maxWorkers, workerPath);

  const processOneQueueItem = (
    task: Task<T>,
    callback: ErrorCallback<Error>
  ) => {
    const worker = workerPool.getAvailableWorker();
    if (!worker) {
      callback(new Error('No available worker'));
      return;
    }

    worker.postMessage(workerDataMapper(task.data));
    worker.once('message', result => {
      workerPool.releaseWorker(worker);
      resultMapper(result);
      callback(null);
    });

    worker.once('error', error => {
      workerPool.releaseWorker(worker);
      callback(error);
    });

    task.worker = worker;
    task.callback = callback;
  };

  const q = queue<Task<T>>(processOneQueueItem, maxWorkers);
  q.drain(() => {
    console.log('All tasks have been processed');
    workerPool.terminateAllWorkers();
  });
  return q;
}

const maxWorkers = 5;
const workerPath = 'worker.js';

const workerDataMapper = (data: number) => data;
const resultMapper = (result: any) => `Result: ${result}`;

const q = createQueue(maxWorkers, workerPath, workerDataMapper, resultMapper);

for (let i = 0; i < 10; i++) {
  q.push({data: i} as Task<number>);
}
