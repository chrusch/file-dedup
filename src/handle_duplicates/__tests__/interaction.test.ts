// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {confirmDelete, setTestPrompt} from '../interaction';
import PS from 'prompt-sync';

describe('confirmDelete(file)', () => {
  it('calls prompt and returns true when prompt returns "y"', () => {
    const mockFn = jest.fn(() => 'y');
    setTestPrompt(mockFn as unknown as PS.Prompt);

    const file = '/tmp/foo.txt';
    const got = confirmDelete(file);
    const expected = true;
    expect(got).toEqual(expected);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('calls prompt and returns false when prompt returns "n"', () => {
    const mockFn = jest.fn(() => 'n');
    setTestPrompt(mockFn as unknown as PS.Prompt);

    const file = '/tmp/foo.txt';
    const got = confirmDelete(file);
    const expected = false;
    expect(got).toEqual(expected);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('calls prompt and returns false when prompt returns empty string', () => {
    const mockFn = jest.fn(() => 'n');
    setTestPrompt(mockFn as unknown as PS.Prompt);

    const file = '/tmp/foo.txt';
    const got = confirmDelete(file);
    const expected = false;
    expect(got).toEqual(expected);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
