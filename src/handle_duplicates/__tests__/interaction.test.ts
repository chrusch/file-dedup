// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {
  confirmDelete,
  originalPromptWrapper,
  promptWrapper,
  setTestPrompt,
  SimplePrompt,
} from '../interaction';
import prompt from 'prompt';
import colors from '@colors/colors/safe';

describe('confirmDelete(file)', () => {
  it('calls prompt and returns true when prompt returns "y"', async () => {
    const mockFn = jest.fn((message: string, givenPrompt: SimplePrompt) => {
      message;
      givenPrompt;
      return Promise.resolve('y');
    });
    setTestPrompt(mockFn);

    const file = '/tmp/foo.txt';
    const got = await confirmDelete(file);
    const expected = true;
    expect(got).toEqual(expected);
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn.mock.calls[0][0]).toEqual(
      "Delete /tmp/foo.txt? ('y' deletes it) > "
    );
  });

  it('calls prompt and returns false when prompt returns "n"', async () => {
    const mockFn = jest.fn((message: string, givenPrompt: SimplePrompt) => {
      message;
      givenPrompt;
      return Promise.resolve('n');
    });
    setTestPrompt(mockFn);

    const file = '/tmp/foo.txt';
    const got = await confirmDelete(file);
    const expected = false;
    expect(got).toEqual(expected);
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn.mock.calls[0][0]).toEqual(
      "Delete /tmp/foo.txt? ('y' deletes it) > "
    );
  });

  it('calls prompt and returns false when prompt returns empty string', async () => {
    const mockFn = jest.fn((message: string, givenPrompt: SimplePrompt) => {
      message;
      givenPrompt;
      return Promise.resolve('');
    });
    setTestPrompt(mockFn);
    const file = '/tmp/foo.txt';
    const got = await confirmDelete(file);
    const expected = false;
    expect(got).toEqual(expected);
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn.mock.calls[0][0]).toEqual(
      "Delete /tmp/foo.txt? ('y' deletes it) > "
    );
  });

  it('throws an error when exit is requested', async () => {
    const mockFn = jest.fn((message: string, givenPrompt: SimplePrompt) => {
      message;
      givenPrompt;
      return Promise.resolve('q');
    });
    setTestPrompt(mockFn);
    const file = '/tmp/foo.txt';
    expect(() => confirmDelete(file)).rejects.toEqual(
      new Error('exit requested')
    );
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn.mock.calls[0][0]).toEqual(
      "Delete /tmp/foo.txt? ('y' deletes it) > "
    );
  });
});

describe('promptWrapper()', () => {
  it('sends description to givenPrompt', async () => {
    const mockGetFn = jest.fn((args: prompt.Schema) => {
      args;
      return Promise.resolve({confirm: 'y'});
    });
    const mockStartFn = jest.fn(() => {});
    setTestPrompt(originalPromptWrapper);
    const message = 'some message';
    const givenPrompt: SimplePrompt = {
      message: 'prompt',
      delimiter: ':',
      start: mockStartFn,
      get: mockGetFn,
    } as unknown as typeof prompt;
    const got = await promptWrapper(message, givenPrompt);
    const expected = 'y';
    expect(got).toEqual(expected);
    expect(mockStartFn).toHaveBeenCalledTimes(1);
    expect(mockGetFn).toHaveBeenCalledTimes(1);
    expect(mockGetFn.mock.calls[0][0]).toEqual([
      {
        default: 'n',
        description: colors.magenta('some message'),
        message: 'Please reply with y for yes, n for no, or x for exit',
        name: 'confirm',
        pattern: /^[yYnNxXqQ]?$/,
        required: true,
      },
    ]);
  });
});
