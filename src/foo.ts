// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {isMainThread, parentPort, workerData} from 'node:worker_threads';
import {beAWorkerThreadNoAutoExit} from './worker_threads_old/worker_thread_utilities';
// import {getWorkerPool} from './worker_pool';
// import path from 'path';
// import os from 'os';

// declare global {
//   const __TEST__: boolean;
// }

// __filename is not what we would expect it to be when we run jest tests
// and so we have to make a distinction here between test and production runs
// let testEnv = true;
// try {
//   testEnv = __TEST__;
// } catch (e) {
//   if (e instanceof ReferenceError) {
//     testEnv = false;
//   } else {
//     throw e;
//   }
// }

// const myFilename = testEnv
//   ? path.join(__dirname, '../../../build/src/worker_threads/worker_threads.js')
//   : __filename;
// called from another file and only run in main thread

type Result = [string, string];
const workerLogic = async (filepath: string): Promise<Result> => {
  // console.log('in workerLogic() in worker thread');
  return [filepath, 'hashDigest'];
};

if (!isMainThread)
  beAWorkerThreadNoAutoExit(parentPort, workerData, workerLogic);
