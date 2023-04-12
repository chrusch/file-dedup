// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {confirmDelete, setTestPrompt, SimplePrompt} from '../interaction';

describe('confirmDelete(file)', () => {
  it('calls prompt and returns true when prompt returns "y"', () => {
    const mockFn: SimplePrompt = jest.fn(() => 'y');
    setTestPrompt(mockFn);

    const file = '/tmp/foo.txt';
    const got = confirmDelete(file);
    const expected = true;
    expect(got).toEqual(expected);
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith(
      "Delete /tmp/foo.txt? ('y' deletes it) > "
    );
  });

  it('calls prompt and returns false when prompt returns "n"', () => {
    const mockFn: SimplePrompt = jest.fn(() => 'n');
    setTestPrompt(mockFn);

    const file = '/tmp/foo.txt';
    const got = confirmDelete(file);
    const expected = false;
    expect(got).toEqual(expected);
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith(
      "Delete /tmp/foo.txt? ('y' deletes it) > "
    );
  });

  it('calls prompt and returns false when prompt returns empty string', () => {
    const mockFn: SimplePrompt = jest.fn(() => 'n');
    setTestPrompt(mockFn);

    const file = '/tmp/foo.txt';
    const got = confirmDelete(file);
    const expected = false;
    expect(got).toEqual(expected);
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith(
      "Delete /tmp/foo.txt? ('y' deletes it) > "
    );
  });
});
