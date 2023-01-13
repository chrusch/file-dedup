// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

export type WorkItem = () => Promise<void>;
export type WorkQueue = WorkItem[];
export type OnAllWorkCompleteCallBack = () => void;
export type Job<T> = (dataItem: T) => Promise<void>;
type ResolveType = () => void;

// Run all jobs making sure numActiveWorkItems never increases beyond
// processLimit. Return a promise that resolves when all work is complete.
export async function doAllWorkInQueue(
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
