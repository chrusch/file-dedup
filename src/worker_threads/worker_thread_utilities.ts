// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {Worker, MessagePort} from 'node:worker_threads';

// export function makeOneWorkerThread<WorkerInput, WorkerResult>(
//   filename: string,
//   inputData: WorkerInput[],
//   processOneResult: (result: WorkerResult) => void
// ): Worker {
//   const worker = new Worker(filename, {
//     workerData: inputData.shift(),
//   });
//   worker.on('message', (message: WorkerResult) => {
//     processOneResult(message);
//     if (inputData.length > 0) {
//       worker.postMessage(inputData.shift());
//     } else {
//       worker.postMessage(null);
//     }
//   });
//   worker.on('error', error => {
//     console.error(error);
//   });
//   worker.on('exit', code => {
//     if (code !== 0) console.error(`Worker stopped with exit code ${code}`);
//     else 1;
//   });
//   return worker;
// }

let workerId = 0;
export function makeOneWorkerThreadNoAutoExit<WorkerResult>(
  filename: string,
  processOneResult: (result: WorkerResult) => void
): Worker {
  workerId += 1;
  const workerInput = undefined;
  const worker = new Worker(filename, {
    workerData: {workerId, workerInput},
  });
  worker.on('message', (message: WorkerResult) => {
    processOneResult(message);
  });
  worker.on('shutdown', () => {
    worker.postMessage(null);
  });
  worker.on('error', error => {
    console.error(error);
  });
  worker.on('exit', code => {
    if (code !== 0) console.error(`Worker stopped with exit code ${code}`);
    else null;
  });
  return worker;
}

// export async function beAWorkerThread<WorkerInput, WorkerResult>(
//   parentPort: MessagePort | null,
//   workerData: WorkerInput,
//   workerLogic: (message: WorkerInput) => Promise<WorkerResult>
// ): Promise<void> {
//   if (parentPort === null) throw 'parentPort unexpectedly null';

//   const getAndPostResult = async (data: WorkerInput) => {
//     parentPort.postMessage(await workerLogic(data));
//   };

//   parentPort.on('message', async (message: WorkerInput) => {
//     if (message === null) {
//       // we are done
//       parentPort.close();
//     } else {
//       await getAndPostResult(message);
//     }
//   });
//   await getAndPostResult(workerData);
// }

export async function beAWorkerThreadNoAutoExit<WorkerInput, WorkerResult>(
  parentPort: MessagePort | null,
  workerData: {workerId: number; workerInput: WorkerInput},
  workerLogic: (message: WorkerInput) => Promise<WorkerResult>
): Promise<void> {
  interface JobMessage {
    jobId: number;
    workerInput: WorkerInput;
  }

  interface JobResultMessage {
    jobId: number;
    result: WorkerResult;
  }

  const {workerId: _workerId, workerInput: _workerInputNotUsed} = workerData;
  if (parentPort === null) throw 'parentPort unexpectedly null';

  const getAndPostResult = async (jobMessage: JobMessage) => {
    const {jobId, workerInput} = jobMessage;
    const jobResultMessage: JobResultMessage = {
      jobId,
      result: await workerLogic(workerInput),
    };
    parentPort.postMessage(jobResultMessage);
  };

  parentPort.on('message', async (message: null | JobMessage) => {
    if (message === null) {
      // we are done, shut down
      parentPort.close();
    } else {
      await getAndPostResult(message);
    }
  });
}
