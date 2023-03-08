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

export const makeWorkQueue = <DataItemType>(
  dataItems: readonly DataItemType[],
  doAJob: Job<DataItemType>
): WorkQueue => dataItems.map(dataItem => () => doAJob(dataItem));

export function startWorkQueue(
  workQueue: WorkQueue,
  processLimit: number // program will crash if it spawns too many processes at once
): WorkQueuer {
  return new WorkQueuer(processLimit)
    .addJobs(workQueue)
    .on('all_work_done', () => {})
    .doWork();
}

export class WorkQueuer extends EventEmitter {
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
      this.numActiveWorkItems -= 1;
    });
    this.on('all_work_done', () => {
      this.allWorkDone = true;
    });
  }

  addJobs(jobs: WorkItem[]) {
    this.workItems.push(...jobs);
    this.allWorkDone = false;
    this.scheduleWork(0);
    return this;
  }

  scheduleWork(milliseconds: number) {
    setTimeout(() => this.doWork(), milliseconds);
  }

  doWork() {
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
