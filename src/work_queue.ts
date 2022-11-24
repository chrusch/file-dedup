// Copyright (c) 2022, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

export type WorkItem = (onCompleteCallBack: OnJobCompleteCallBack) => void;
export type WorkQueue = WorkItem[];
export type OnJobCompleteCallBack = () => void;
export type OnAllWorkCompleteCallBack = () => void;
export type Job<T> = (dataItem: T, onComplete: OnJobCompleteCallBack) => void;
type ResolveType = (value: true) => void;

// Run all jobs making sure numActiveWorkItems never increases beyond
// processLimit. Return a promise that resolves when all work is complete.
export async function doAllWorkInQueue(
  workQueue: WorkQueue,
  processLimit: number // program will crash if it spawns too many processes at once
): Promise<true> {
  let numActiveWorkItems = 0;
  const onWorkItemComplete: OnJobCompleteCallBack = () => {
    numActiveWorkItems -= 1;
  };
  const doWork = (onAllWorkInQueueComplete: ResolveType): void => {
    // Are there more work items to complete?
    if (workQueue.length > 0) {
      // Have we reached our active work item limit yet?
      // If not, do execute another one.
      if (numActiveWorkItems < processLimit) {
        const workItem = workQueue.shift();
        if (workItem) {
          numActiveWorkItems += 1;
          workItem(onWorkItemComplete);
          setTimeout(() => doWork(onAllWorkInQueueComplete), 0);
        }
      } else {
        // Too many active work items. Wait a bit and try again.
        setTimeout(() => doWork(onAllWorkInQueueComplete), 10);
      }
    } else if (numActiveWorkItems > 0) {
      // Still some processes going. Wait a bit and then see if all work is
      // done.
      setTimeout(() => doWork(onAllWorkInQueueComplete), 200);
    } else {
      // when all work items are done resolve the promise
      onAllWorkInQueueComplete(true);
    }
  };
  // This promise resolves when the work queue is empty and the number of
  // active process is 0, i.e., when all work items have completed
  return new Promise((resolve: ResolveType) => {
    doWork(resolve);
  });
}

export function workItemMakerToWorkQueue<DataItemType>(
  dataItems: DataItemType[],
  workItemMaker: (dataItem: DataItemType) => WorkItem
): WorkQueue {
  return dataItems.map(dataItem => workItemMaker(dataItem));
}

export function makeWorkQueue<DataItemType>(
  dataItems: DataItemType[],
  doAJob: Job<DataItemType>
): WorkQueue {
  const workItemMaker =
    (dataItem: DataItemType): WorkItem =>
    (onWorkItemComplete): void =>
      doAJob(dataItem, onWorkItemComplete);
  return workItemMakerToWorkQueue<DataItemType>(dataItems, workItemMaker);
}
