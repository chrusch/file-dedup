// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import pathModule from 'path';
import {accessSync, existsSync, lstatSync} from 'fs';
import fs from 'fs';
import _ from 'lodash';
import {warn} from '../handle_duplicates/display';

// represents a path that has been verified to represent
// an exiting accessible directory
// At runtime, it is a just a string, but with TypeScript,
// we can pretend that it is also an object with _brand property
export type VerifiedDirectoryPath = string & {
  _brand: 'VerifiedDirectoryPath';
};

// Warn and return undefined if a givenPath is not a string representing an
// existing, accessible directory
// Otherwise return a VerifiedDirectoryPath object
function createOneVerifiedDirectoryPath(
  givenPath: string
): VerifiedDirectoryPath | undefined {
  try {
    const normalizedPath = normalize(givenPath);
    verifyDirectoryPath(normalizedPath);
    return normalizedPath;
  } catch (err) {
    if (err && typeof err === 'object') {
      if ('message' in err && typeof err.message === 'string') {
        outputError(err.message, givenPath);
        return undefined;
      }
    }
    throw err;
  }
}

// discards invalid paths
export function verifyDirectoryPaths(
  ...paths: readonly string[]
): VerifiedDirectoryPath[] {
  return _(paths).map(createOneVerifiedDirectoryPath).compact().value();
}

// circumvents normal verifications
// strictly for testing
export function forceVerificationOfDirectoryPaths(
  ...paths: readonly string[]
): VerifiedDirectoryPath[] {
  return paths.map(forceVerificationOfDirectoryPath);
}

// circumvents normal verifications
// strictly for testing
export function forceVerificationOfDirectoryPath(
  path: string
): VerifiedDirectoryPath {
  return path as VerifiedDirectoryPath;
}

function outputError(message: string, givenPath: string) {
  const errorMessage = `${message}: ignoring ${givenPath}`;
  warn(errorMessage);
}

function verifyDirectoryPath(
  path: string | undefined
): asserts path is VerifiedDirectoryPath {
  if (!path) {
    throw new Error('please provide a path that is a valid string');
  }
  if (!exists(path)) {
    throw new Error('please provide a path for an existing directory');
  }
  if (!accessible(path)) {
    throw new Error(
      'please provide a path to a directory you have permission to read'
    );
  }
  if (!isDirectory(path)) {
    throw new Error(
      'please provide a path to a directory (not a regular file or symlink)'
    );
  }
}

function normalize(path: string): string | undefined {
  try {
    return pathModule.normalize(path);
  } catch (err) {
    return undefined;
  }
}

function exists(path: string): boolean {
  return existsSync(path);
}

// a directory needs to have the R and X bits set to be fully
// accessible
function accessible(path: string): boolean {
  try {
    accessSync(path, fs.constants.R_OK | fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function isDirectory(path: string): boolean {
  try {
    const stat = lstatSync(path);
    return stat.isDirectory();
  } catch {
    return false;
  }
}
