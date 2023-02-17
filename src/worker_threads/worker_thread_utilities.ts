// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {Worker, MessagePort} from 'node:worker_threads';
import _ from 'lodash';

export function makeOneWorkerThread<WorkerInput, WorkerResult>(
  filename: string,
  inputData: WorkerInput[],
  processOneResult: (result: WorkerResult) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (inputData.length === 0) return resolve();
    const worker = new Worker(filename, {
      workerData: inputData.shift(),
    });
    worker.on('message', (message: WorkerResult) => {
      processOneResult(message);
      if (inputData.length > 0) {
        worker.postMessage(inputData.shift());
      } else {
        worker.postMessage(null);
        // worker.terminate();
      }
    });
    worker.on('error', error => {
      reject(error);
    });
    worker.on('exit', code => {
      if (code !== 0)
        reject(new Error(`Worker stopped with exit code ${code}`));
      else resolve();
    });
  });
}

export async function makeWorkerThreads<WorkerInput, WorkerResult>(
  filename: string,
  inputData: readonly WorkerInput[],
  numThreads: number,
  processOneResult: (result: WorkerResult) => void
): Promise<void> {
  const data = [...inputData];
  const allWorkerPromises = _.times(numThreads, () =>
    makeOneWorkerThread(filename, data, processOneResult)
  );
  return Promise.all(allWorkerPromises).then(() => undefined);
}

export async function beAWorkerThread<WorkerInput, WorkerResult>(
  parentPort: MessagePort | null,
  workerData: WorkerInput,
  workerLogic: (message: WorkerInput) => Promise<WorkerResult>
): Promise<void> {
  if (parentPort === null) throw 'parentPort unexpectedly null';

  const getAndPostResult = async (data: WorkerInput) => {
    parentPort.postMessage(await workerLogic(data));
  };

  parentPort.on('message', async (message: WorkerInput) => {
    if (message === null) {
      // we are done
      parentPort.close();
    } else {
      await getAndPostResult(message);
    }
  });
  await getAndPostResult(workerData);
}
