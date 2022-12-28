// Copyright (c) 2022, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {
  silentOutput,
  unSilenceOutput,
  showListLengths,
  silenceOutput,
} from '../src/display';

describe('silentOutput()', () => {
  it('does what is expected', () => {
    const got = silentOutput();
    const expected = false;
    expect(got).toEqual(expected);
  });
});

describe('silenceOutput()', () => {
  it('does what is expected', () => {
    silenceOutput();
    const got = silentOutput();
    const expected = true;
    expect(got).toEqual(expected);
  });
});

describe('unSilenceOutput()', () => {
  it('does what is expected', () => {
    silenceOutput();
    const got = silentOutput();
    const expected = true;
    expect(got).toEqual(expected);
    unSilenceOutput();
    const got2 = silentOutput();
    const expected2 = false;
    expect(got2).toEqual(expected2);
  });
});

describe('showListLengths()', () => {
  it('does what is expected', () => {
    silenceOutput();
    const got = showListLengths(22, 45);
    const expected = undefined;
    expect(got).toEqual(expected);
  });
});
