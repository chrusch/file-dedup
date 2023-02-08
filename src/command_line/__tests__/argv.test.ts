// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.
//
import {getArgv, setArgv} from '../argv';

// STUBS
describe('getArgv()', () => {
  it('does what is expected', () => {
    const got = getArgv();
    expect(typeof got).toEqual('object');
  });
});

describe('setArgv()', () => {
  it('does what is expected', () => {
    const newArgv: string[] = [];
    const got = setArgv(newArgv);
    const expected = undefined;
    expect(got).toEqual(expected);
  });
});
