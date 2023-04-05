// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

// TODO: Make node hashing the default since it is faster
import {aPath, Path} from '../common/path';
import {hashAllCandidateFilesWithNode} from '../node_hash_file/node_hash_stream';
import {hashAllCandidateFilesWithShasumCommand} from './shasum_hash_stream';
import {Transform} from 'stream';
import which from 'which';
import os from 'node:os';

/** A pair consisting of the path of the file hashed and
  the SHA sum of the file content */
export type HashDatum = [Path, string];
/** An array of HashDatum tuples */
export type HashData = HashDatum[];

/**
 * Determine the location of the given command in the current PATH.
 *
 * @param cmd - The name of the command
 * @returns A promise resolving to path of the command if it can be found in
 *          the current path
 */
export async function commandExists(cmd: string): Promise<string> {
  return await which(cmd, {nothrow: true});
}

/**
 * Returns a transform stream that can be used to get the hash digest of files
 *
 * @param nodeHashing - Calculate the hash digest using node libraries as opposed to using the shasum command line tool?
 * @returns A stream that can be used to calculate the hash digest of input files.
 */
export async function hashAllCandidateFiles(
  nodeHashing: boolean
): Promise<Transform> {
  const cmd = await commandExists('shasum');
  // TODO test unreadable directory
  // TODO with future versions of node, use os.availableParallelism()
  // instead of os.cpus().length
  const concurrency = os.cpus().length;
  if (cmd && !nodeHashing) {
    return hashAllCandidateFilesWithShasumCommand(aPath(cmd), concurrency);
  } else {
    return hashAllCandidateFilesWithNode(concurrency);
  }
}
