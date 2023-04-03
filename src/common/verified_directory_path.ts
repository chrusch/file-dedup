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

/**
 * A path that has been verified to represent an exiting accessible
 * directory. At runtime, it is a string, but with TypeScript, we can
 * pretend that it is also an object with the _brand property set to
 * "VerifiedDirectoryPath".
 */
export type VerifiedDirectoryPath = string & {
  _brand: 'VerifiedDirectoryPath';
};

/**
 * Check that givenPath is an existing accessible directory and return a
 * corresponding VerifiedDirectoryPath object. If givenPath does not pass the
 * checks, return undefined and output a warning.
 *
 * @param givenPath - A string representing a path to a directory
 * @returns a VerifiedDirectoryPath if the givenPath checks out, otherwise
 *          returns undefined
 *
 */
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

/**
 * Turn an array of string paths into an array of VerifiedDirectoryPaths while
 * discarding paths that cannot be verified as existing accessible directories.
 *
 * @param paths - Strings reprenting file or directory paths
 * @returns VerifiedDirectoryPaths
 */
export function verifyDirectoryPaths(
  ...paths: readonly string[]
): VerifiedDirectoryPath[] {
  return _(paths).map(createOneVerifiedDirectoryPath).compact().value();
}

/**
 * Force typescript to consider an array of strings to be VerifiedDirectoryPaths
 * without the usual checks.
 *
 * @remarks
 *
 * This function is a utility function intended to help in testing only.
 *
 * @param paths - String representing paths to directories
 * @returns The same string as a VerifiedDirectoryPath
 */
export function forceVerificationOfDirectoryPaths(
  ...paths: readonly string[]
): VerifiedDirectoryPath[] {
  return paths.map(forceVerificationOfDirectoryPath);
}

/**
 * Force typescript to consider a string to be VerifiedDirectoryPath without the
 * usual checks.
 *
 * @remarks
 *
 * This function is a utility function intended to help in testing only.
 *
 *
 * @param path - A string representing a path to a directory
 * @returns The same string as a VerifiedDirectoryPath
 */
export function forceVerificationOfDirectoryPath(
  path: string
): VerifiedDirectoryPath {
  return path as VerifiedDirectoryPath;
}

/**
 * Output an error message indicating that we are ignoring an invalid path.
 *
 * @param message - The message to output
 * @param givenPath - The path of the file we are ignoring
 * @returns Void
 */
function outputError(message: string, givenPath: string) {
  const errorMessage = `${message}: ignoring ${givenPath}`;
  warn(errorMessage);
}

/**
 * An assertion function that takes a string or undefined value and verifies
 * that it represents a directory that exists and is accessible.
 *
 * @param path - the path of the file or directory, or else undefined
 * @throws An error if the path is not an existing accessible directory
 */
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

/**
 * Returns a normalized file path.
 *
 * @param path - the path of the file or directory
 * @returns A normalized path if possible, otherwise undefined
 */
function normalize(path: string): string | undefined {
  try {
    return pathModule.normalize(path);
  } catch (err) {
    return undefined;
  }
}

/**
 * Does the file or directory exist?
 *
 * @param path - the path of the file or directory
 * @returns True if the file or directory exists
 */
function exists(path: string): boolean {
  return existsSync(path);
}

/**
 * Is the directory accessible?
 *
 * @param path - the path of the directory
 * @returns True if the directory is readable and executable
 */
function accessible(path: string): boolean {
  try {
    accessSync(path, fs.constants.R_OK | fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns a boolean value indicating whether the path is a directory.
 *
 * @param path - A file path
 * @returns A boolean value indicating whether the path is a directory
 */
function isDirectory(path: string): boolean {
  try {
    const stat = lstatSync(path);
    return stat.isDirectory();
  } catch {
    return false;
  }
}
