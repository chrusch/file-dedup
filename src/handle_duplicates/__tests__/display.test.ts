// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {
  lastLogMessages,
  lastWarnMessages,
  showDuplicates,
  showTotalDeleted,
  silenceOutput,
  silentOutput,
  unSilenceOutput,
  warn,
} from '../display';
import {aPath} from '../../common/path';

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

describe('showDuplicates()', () => {
  it('does not output anything when output is silenced', () => {
    silenceOutput();
    const got = showDuplicates([aPath('/a'), aPath('/b'), aPath('/c')]);
    const expected = undefined;
    expect(got).toEqual(expected);
  });
});

describe('showTotalDeleted()', () => {
  it('does not output anything when output is silenced and reallyDelete is true', () => {
    silenceOutput();
    const got = showTotalDeleted(7, true);
    const expected = undefined;
    expect(got).toEqual(expected);
    expect(lastLogMessages(1)).toEqual([['Number of files deleted: 7\n\n']]);
  });

  it('does not output anything when output is silenced and reallyDelete is false', () => {
    silenceOutput();
    const got = showTotalDeleted(7, false);
    const expected = undefined;
    expect(got).toEqual(expected);
    expect(lastLogMessages(1)).toEqual([
      [
        'Number of files that would have been deleted with --reallyDelete: 7\n\n',
      ],
    ]);
  });
});

describe('lastWarnMessages', () => {
  it('retrieves recent warn messages', () => {
    warn('a');
    warn('b');
    warn('c');
    const got = lastWarnMessages(2);
    const expected = [['b'], ['c']];
    expect(got).toEqual(expected);
  });
});
