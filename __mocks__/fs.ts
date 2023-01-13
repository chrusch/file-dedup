// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import path from 'path';

export type MockFile = [string, number, number];
export type MockFiles = {
  [path: string]: MockFile[];
};

export type MockFileList = {
  [path: string]: [number, number];
};

interface Stat {
  isFile: () => boolean;
  isDirectory: () => boolean;
  size: number;
  ino: number;
}

export interface FS {
  __setMockFiles: (files: MockFileList) => void;
  lstatSync: (path: string) => Stat;
  readdirSync: (dir: string) => string[];
  realpathSync: (path: string) => string;
  unlinkSync: (path: string) => void;
}

const fs: FS = jest.createMockFromModule('fs');

// This is a custom function that our tests can use during setup to specify
// what the files on the "mock" filesystem should look like when any of the
// `fs` APIs are used.
let mockFiles: MockFiles = Object.create(null);
export function __setMockFiles(newMockFiles: MockFileList) {
  mockFiles = Object.create(null);
  for (const file in newMockFiles) {
    const dir = path.dirname(file);

    if (!mockFiles[dir]) {
      mockFiles[dir] = [];
    }
    const filename: string = path.basename(file);
    const ino: number = newMockFiles[file][0];
    const size: number = newMockFiles[file][1];
    mockFiles[dir].push([filename, ino, size]);
  }
}

// export function lstatSync(_dir: string): Stat {
export function lstatSync(pathString: string): Stat {
  const dir = path.dirname(pathString);
  // it's a directory
  if (mockFiles[pathString]) {
    const parentDir = path.dirname(pathString);
    const hasDirname = (element: MockFile) => element[0] === parentDir;
    let fileInfo: MockFile = [parentDir, -1, -1];
    if (mockFiles[parentDir]) {
      fileInfo = mockFiles[parentDir].find(hasDirname) || fileInfo;
    }
    return {
      isFile: () => false,
      isDirectory: () => true,
      ino: fileInfo[1],
      size: fileInfo[2],
    };
  }

  // it's in a directory
  const dirFiles = mockFiles[dir];
  if (dirFiles) {
    const filename = path.basename(pathString);
    const hasFilename = (element: MockFile) => element[0] === filename;
    const fileInfo: MockFile | undefined = dirFiles.find(hasFilename);
    // it's a file
    if (fileInfo) {
      return {
        isFile: () => true,
        isDirectory: () => false,
        ino: fileInfo[1],
        size: fileInfo[2],
      };
    }
  }

  // it's not a directory and not in a directory
  return {
    isFile: () => false,
    isDirectory: () => false,
    ino: -1,
    size: -1,
  };
}

// A custom version of `readdirSync` that reads from the special mocked out
// file list set via __setMockFiles
export function readdirSync(directoryPath: string): string[] {
  const dirWithoutTrailingSlash: string = directoryPath.match(/.\/$/)
    ? directoryPath.replace(/\/$/, '')
    : directoryPath;
  return (
    (mockFiles[dirWithoutTrailingSlash] || []).map(element => element[0]) || []
  );
}

let unlinkCallback: (path: string) => void | undefined;
export function setUnlinkCallback(_unlinkCallback: (path: string) => void) {
  unlinkCallback = _unlinkCallback;
}

export function unlinkSync(path: string): void {
  unlinkCallback && unlinkCallback(path);
}

export function realpathSync(path: string): string {
  return path;
}

fs.__setMockFiles = __setMockFiles;
fs.readdirSync = readdirSync;
fs.lstatSync = lstatSync;
fs.unlinkSync = jest.fn(unlinkSync);
fs.realpathSync = jest.fn(realpathSync);

export default fs;
