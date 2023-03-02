// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {
  // doAllWorkInQueue,
  makeWorkQueue,
  // workItemMakerToWorkQueue,
  WorkItem,
  // Job,
} from '../work_queue';
// import {exec} from 'child_process';
// import {ExecException} from 'child_process';

describe('makeWorkQueue()', () => {
  it('when given data and logic, creates an array of functions that, when run, have the anticipated effect', () => {
    const dataItems = ['e', 'f', 'g', 'h'];
    let count = 0;
    const callback = () => {
      count += 1;
    };
    let inputs = 'input:';
    const doAJob = (item: string) => {
      inputs += item;
      callback();
      return Promise.resolve();
    };
    const workQueue = makeWorkQueue(dataItems, doAJob);
    const got = workQueue.map((workItem: WorkItem) => {
      workItem();
    });
    const expected: string[] = [];
    expect(got).toEqual(expected);
    expect(count).toEqual(4);
    expect(inputs).toEqual('input:efgh');
  });
});

describe('doAllWorkInQueue()', () => {
  // it('runs all items in the work queue', async () => {
  //   const dataItems: string[] = ['i', 'j', 'k', 'l', 'm'];
  //   let count = 0;
  //   let output = 'output:';
  //   const doAJob: Job<string> = (dataItem: string) => {
  //     output += dataItem;
  //     const callback = (
  //       resolve: () => void,
  //       err: ExecException | null
  //     ): void => {
  //       if (err) throw err;
  //       count += 1;
  //       resolve();
  //     };
  //     return new Promise(resolve =>
  //       exec('/bin/sleep 0.1', {}, (x: ExecException | null) =>
  //         callback(resolve, x)
  //       )
  //     );
  //   };
  //   const workQueue = makeWorkQueue<string>(dataItems, doAJob);
  //   // const processLimit = 2;
  //   // const got = await doAllWorkInQueue(workQueue, processLimit);
  //   const got = undefined;
  //   const expected = undefined;
  //   expect(got).toEqual(expected);
  //   expect(count).toEqual(5);
  //   expect(output).toEqual('output:ijklm');
  // });
});
