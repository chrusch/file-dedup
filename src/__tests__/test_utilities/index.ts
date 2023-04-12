// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {Duplex, Readable, Writable} from 'node:stream';

export function outputOfReadableStream(stream: Readable): Promise<unknown[]> {
  return new Promise((resolve: (output: unknown[]) => void, reject) => {
    const output: unknown[] = [];
    stream
      .on('data', (chunk: unknown) => {
        output.push(chunk);
      })
      .on('end', () => {
        resolve(output);
      })
      .on('error', err => {
        reject(
          'error caught in stream in outputOfReadableStream: ' + err.message
        );
      });
  });
}

export function inputToWritableStream(
  stream: Writable,
  input: unknown[]
): void {
  input.forEach((item: unknown) => {
    stream.write(item);
  });
  stream.end();
}

export async function outputOfDuplexStreamWithInput(
  stream: Duplex,
  input: unknown[]
): Promise<unknown[]> {
  inputToWritableStream(stream, input);
  return await outputOfReadableStream(stream);
}

export async function asyncGeneratorToArray<T>(
  gen: AsyncIterable<T>
): Promise<T[]> {
  const out: T[] = [];
  for await (const x of gen) {
    out.push(x);
  }
  return out;
}
