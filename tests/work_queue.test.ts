// Copyright (c) 2022, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {
  doAllWorkInQueue,
  makeWorkQueue,
  OnJobCompleteCallBack,
  workItemMakerToWorkQueue,
  WorkItem,
} from '../src/work_queue';
import {exec} from 'child_process';
import {ExecException} from 'child_process';

// work on it strings
describe('workItemMakerToWorkQueue()', () => {
  it('does what is expected', () => {
    const dataItems = ['a', 'b', 'c', 'd'];
    let count = 0;
    const callback = () => {
      count += 1;
    };
    let inputs = 'foo:';
    const workItemMaker =
      (item: string) => (callback: OnJobCompleteCallBack) => {
        inputs += item;
        callback();
      };
    const workQueue = workItemMakerToWorkQueue<string>(
      dataItems,
      workItemMaker
    );
    const expected: string[] = [];
    const got = workQueue.map((workItem: WorkItem) => workItem(callback));
    expect(got).toEqual(expected);
    expect(count).toEqual(4);
    expect(inputs).toEqual('foo:abcd');
  });
});

describe('makeWorkQueue()', () => {
  it('does what is expected', () => {
    const dataItems = ['e', 'f', 'g', 'h'];
    let count = 0;
    const callback = () => {
      count += 1;
    };
    let inputs = 'foo:';
    const doAJob = (item: string, callback: OnJobCompleteCallBack) => {
      inputs += item;
      callback();
    };
    const workQueue = makeWorkQueue(dataItems, doAJob);
    const got = workQueue.map((workItem: WorkItem) => {
      workItem(callback);
    });
    const expected: string[] = [];
    expect(got).toEqual(expected);
    expect(count).toEqual(4);
    expect(inputs).toEqual('foo:efgh');
  });
});

describe('doAllWorkInQueue()', () => {
  it('does what is expected', async () => {
    const dataItems: string[] = ['i', 'j', 'k', 'l', 'm'];
    let count = 0;
    let output = 'output:';
    const doAJob = (
      dataItem: string,
      onComplete: OnJobCompleteCallBack
    ): void => {
      output += dataItem;
      const callback = (
        err: ExecException | null
        // _stdout: string,
        // _stderr: string
      ): void => {
        if (err) throw err;
        count += 1;
        onComplete();
      };
      exec('/bin/sleep 0.1', {}, callback);
    };
    const workQueue = makeWorkQueue<string>(dataItems, doAJob);
    const processLimit = 2;
    const got = await doAllWorkInQueue(workQueue, processLimit);
    const expected = true;
    expect(got).toEqual(expected);
    expect(count).toEqual(5);
    expect(output).toEqual('output:ijklm');
  });
});
