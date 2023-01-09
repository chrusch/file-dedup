// Copyright (c) 2022, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {
  silentOutput,
  unSilenceOutput,
  showDuplicates,
  showListLengths,
  showTotalDeleted,
  silenceOutput,
} from '../src/display';

describe('silentOutput()', () => {
  it('has expected default behavior', () => {
    const got = silentOutput();
    const expected = false;
    expect(got).toEqual(expected);
  });
});

describe('silenceOutput()', () => {
  it('when silenced, silentOutput returns true', () => {
    silenceOutput();
    const got = silentOutput();
    const expected = true;
    expect(got).toEqual(expected);
  });
});

describe('unSilenceOutput()', () => {
  it('when unSilenceOutput is called, silentOutput returns false', () => {
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
  it('does now output anything when output is silenced', () => {
    silenceOutput();
    const got = showListLengths(22, 45);
    const expected = undefined;
    expect(got).toEqual(expected);
  });
});

describe('showDuplicates()', () => {
  it('does now output anything when output is silenced', () => {
    silenceOutput();
    const got = showDuplicates(['a', 'b', 'c']);
    const expected = undefined;
    expect(got).toEqual(expected);
  });
});

describe('showTotalDeleted()', () => {
  it('does now output anything when output is silenced', () => {
    silenceOutput();
    const got = showTotalDeleted(7, true);
    const expected = undefined;
    expect(got).toEqual(expected);
  });
});
