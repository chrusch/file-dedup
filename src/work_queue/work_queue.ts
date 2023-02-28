// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import EventEmitter from 'node:events';

export type WorkItem = () => Promise<void>;
export type WorkQueue = WorkItem[];
export type OnAllWorkCompleteCallBack = () => void;
export type Job<T> = (dataItem: T) => Promise<void>;
type ResolveType = () => void;

// Run all jobs making sure numActiveWorkItems never increases beyond
// processLimit. Return a promise that resolves when all work is complete.
export async function doAllWorkInQueueOld(
  workQueue: WorkQueue,
  processLimit: number // program will crash if it spawns too many processes at once
): Promise<void> {
  let numActiveWorkItems = 0;
  const onWorkItemComplete = () => {
    numActiveWorkItems -= 1;
  };
  const doWork = (onAllWorkInQueueComplete: ResolveType): void => {
    const tryAgainLater = (milliseconds: number) =>
      setTimeout(() => doWork(onAllWorkInQueueComplete), milliseconds);

    if (workQueue.length > 0) {
      if (numActiveWorkItems < processLimit) {
        const workItem = workQueue.shift();
        if (workItem) {
          numActiveWorkItems += 1;
          workItem().then(onWorkItemComplete);
          tryAgainLater(0);
        }
      } else {
        tryAgainLater(50);
      }
    } else if (numActiveWorkItems > 0) {
      tryAgainLater(300);
    } else {
      onAllWorkInQueueComplete();
    }
  };
  // This promise resolves when the work queue is empty and the number of
  // active process is 0, i.e., when all work items have completed
  return new Promise((resolve: ResolveType) => doWork(resolve));
}

export const makeWorkQueue = <DataItemType>(
  dataItems: readonly DataItemType[],
  doAJob: Job<DataItemType>
): WorkQueue => dataItems.map(dataItem => () => doAJob(dataItem));

export async function doAllWorkInQueueOld2(
  workQueue: WorkQueue,
  processLimit: number // program will crash if it spawns too many processes at once
): Promise<void> {
  return new Promise(resolve => {
    const resolvePromise = () => {
      resolve();
    };
    new WorkQueue2(processLimit)
      .addJobs(workQueue)
      .on('all_work_done', () => {
        resolvePromise();
      })
      .doWork();
  });
}

export function startWorkQueue(
  workQueue: WorkQueue,
  processLimit: number // program will crash if it spawns too many processes at once
): WorkQueue2 {
  return new WorkQueue2(processLimit)
    .addJobs(workQueue)
    .on('all_work_done', () => {
      // resolvePromise();
    })
    .doWork();
  // const x = new WorkQueue2(processLimit);
  // const y = x.addJobs(workQueue);
  // const z = y.on('all_work_done', () => {
  //   // resolvePromise();
  // });

  // const w = z.doWork();
  // return w;
}

export class WorkQueue2 extends EventEmitter {
  private workItems: WorkItem[];
  private numActiveWorkItems: number;
  private processLimit: number;
  public allWorkDone: boolean;
  constructor(processLimit: number) {
    super();
    this.workItems = [];
    this.processLimit = processLimit;
    this.allWorkDone = true;
    this.numActiveWorkItems = 0;
    this.on('work_item_complete', () => {
      // console.log('in work_item_complete');
      this.numActiveWorkItems -= 1;
    });
    this.on('all_work_done', () => {
      // console.log('in allWorkDone');
      this.allWorkDone = true;
    });
  }

  addJobs(jobs: WorkItem[]) {
    // console.log('in add Jobs');
    this.workItems.push(...jobs);
    this.allWorkDone = false;
    this.scheduleWork(0);
    return this;
  }

  scheduleWork(milliseconds: number) {
    setTimeout(() => this.doWork(), milliseconds);
  }

  doWork() {
    // console.log('in doWork');
    if (this.workItems.length > 0) {
      if (this.numActiveWorkItems < this.processLimit) {
        const workItem = this.workItems.shift();
        if (workItem) {
          this.numActiveWorkItems += 1;
          workItem().then(() => this.emit('work_item_complete'));
          this.scheduleWork(0);
          return this;
        }
      }
    } else if (this.numActiveWorkItems === 0) {
      this.emit('all_work_done');
      return this;
    }
    this.scheduleWork(100);
    return this;
  }
}
