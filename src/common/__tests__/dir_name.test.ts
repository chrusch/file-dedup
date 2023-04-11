// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {getRealPath, runningJestTests} from '../dir_name';

describe('runningJestTests()', () => {
  it('normally returns true', () => {
    const got = runningJestTests();
    const expected = true;
    expect(got).toEqual(expected);
  });

  it('when a ReferenceError is thrown, returns false', () => {
    const got = runningJestTests(true);
    const expected = false;
    expect(got).toEqual(expected);
  });

  it('when another Error is thrown, throws an error', () => {
    expect(() => runningJestTests(false, true)).toThrowError();
  });

  it('returns true when in TEST mode and testNotTest is set to true', () => {
    const got = runningJestTests(false, false, true);
    const expected = false;
    expect(got).toEqual(expected);
  });
});

describe('getRealPath()', () => {
  it('does what is expected', () => {
    const got = getRealPath('foo', true);
    const expected = '/src/foo';
    expect(got).toMatch(expected);
    expect(got).not.toMatch('/build/src/foo');
  });

  it('does what is expected', () => {
    const got = getRealPath('foo', false);
    const expected = '/build/src/foo';
    expect(got).toMatch(expected);
  });
});
