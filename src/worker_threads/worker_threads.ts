// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {isMainThread, parentPort, workerData} from 'node:worker_threads';
import {makeWorkerThreads, beAWorkerThread} from './worker_thread_utilities';
import {Path} from '../common/path';
import path from 'path';
import {HashData, HashDatum} from '../hash_file/hash_files';
import {getSHA256HashDigest} from '../node_hash_file/hash_file';
import os from 'os';

type WorkerInput = Path;
type WorkerResult = HashDatum;
declare global {
  const __TEST__: boolean;
}

// __filename is not what we would expect it to be when we run jest tests
// and so we have to make a distinction here between test and production runs
let testEnv = true;
try {
  testEnv = __TEST__;
} catch (e) {
  if (e instanceof ReferenceError) {
    testEnv = false;
  } else {
    throw e;
  }
}

const myFilename = testEnv
  ? path.join(__dirname, '../../../build/src/worker_threads/worker_threads.js')
  : __filename;
// '/Users/clayton/work/src/ts/file-dedup/build/src/worker_threads/worker_threads.js';
// '/Users/clayton/work/src/ts/file-dedup/src/worker_threads/worker_threads.ts';
// called from another file and only run in main thread
export async function hashFilesInWorkerThreads<WorkerInput>(
  inputData: WorkerInput[]
): Promise<HashData> {
  const results: WorkerResult[] = [];
  const processOneResult = (result: WorkerResult): void => {
    results.push(result);
  };

  const numThreads = Math.min(os.cpus().length, inputData.length);
  await makeWorkerThreads(myFilename, inputData, numThreads, processOneResult);
  return results;
}

const workerLogic = async (filepath: WorkerInput): Promise<WorkerResult> => {
  const progressHandler = () => {
    // TODO
    // show some kind of progress here...
    // console.log('.');
  };
  const hashDigest = await getSHA256HashDigest(filepath, progressHandler);
  return [filepath, hashDigest];
};

if (!isMainThread) beAWorkerThread(parentPort, workerData, workerLogic);