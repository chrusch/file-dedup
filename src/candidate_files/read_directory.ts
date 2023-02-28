// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import pathModule from 'path';
import {Stats} from 'fs';
import {lstat, readdir, stat} from 'node:fs/promises';
import {aPath, Path} from '../common/path';
import {
  // forceVerificationOfDirectoryPath,
  VerifiedDirectoryPath,
} from '../common/verified_directory_path';
import {Readable} from 'stream';

// when path is a symlink and followSymlinks is true, returns the Stats of the
// linked file, otherwise returns the Stats of the literal file system indicated
// by path, whether file, symlink, directory, or whatever.
export async function getFileStatus(
  path: Path,
  followSymlinks: boolean
): Promise<Stats> {
  return followSymlinks ? await stat(path) : await lstat(path);
}

export async function getInode(path: VerifiedDirectoryPath): Promise<number> {
  return (await getFileStatus(aPath(path), true)).ino;
}

export async function readDirectory(
  dir: Path,
  dirCallback: (dir: Path, inode: number) => Promise<void>,
  fileCallback: (file: Path, size: number, ino: number) => void,
  excludedNames: readonly string[],
  followSymlinks: boolean,
  includeDotfiles: boolean
): Promise<void> {
  const files = await readdir(dir);
  // const dirPromises: Promise<void>[] = [];
  const filePromises = files.map(async file => {
    if (excludedNames.includes(file)) return;
    if (!includeDotfiles && file.match('^\\.')) return;

    const pth = aPath(pathModule.join(dir, file));
    const fileStatus = await getFileStatus(pth, followSymlinks);

    if (fileStatus.isDirectory()) {
      await dirCallback(pth, fileStatus.ino);
    } else if (fileStatus.isFile()) {
      fileCallback(pth, fileStatus.size, fileStatus.ino);
    } // silently ignore symlinks and other file system objects
  });
  await Promise.all(filePromises);
}

type DirGenerator = Generator<Path, void, Path[] | undefined | null>;

export function* directoryGenerator(
  initialDirectories: VerifiedDirectoryPath[]
): DirGenerator {
  const directories: Path[] = [...initialDirectories.map(aPath)];
  let done = directories.length === 0;
  while (!done) {
    const nextDir = directories[0];
    if (!nextDir) break;
    const newDirs = yield nextDir;
    if (newDirs === null) {
      // we are being told to shut down
      done = true;
    } else if (newDirs) {
      directories.push(...newDirs);
    } else {
      // undefined
      directories.shift();
    }
  }
}

export async function doDir(
  dir: Path,
  entriesRead: Set<number>,
  dirGenerator: DirGenerator,
  excludedNames: readonly string[],
  followSymlinks: boolean,
  includeDotfiles: boolean
) {
  const dirEntries = await readdir(dir);
  const files: [Path, number][] = [];
  for (const entry of dirEntries) {
    if (excludedNames.includes(entry)) continue;
    if (!includeDotfiles && entry.match('^\\.')) continue;
    const pth = aPath(pathModule.join(dir, entry));
    const fileStatus = await getFileStatus(pth, followSymlinks);
    if (entriesRead.has(fileStatus.ino)) continue;
    entriesRead.add(fileStatus.ino);
    if (fileStatus.isDirectory()) {
      // a new directory for our directory generator
      dirGenerator.next([pth]);
    } else if (fileStatus.isFile()) {
      files.push([pth, fileStatus.size]);
    }
  }
  return files;
}

export async function* filePathGenerator(
  initialDirectories: VerifiedDirectoryPath[],
  excludedNames: readonly string[],
  followSymlinks: boolean,
  includeDotfiles: boolean
): AsyncGenerator<[Path, number], void, Path[] | undefined | null> {
  const entriesRead: Set<number> = new Set();
  const dirGenerator = directoryGenerator(initialDirectories);
  let files: [Path, number][] = [];
  for (const dir of dirGenerator) {
    files = await doDir(
      dir,
      entriesRead,
      dirGenerator,
      excludedNames,
      followSymlinks,
      includeDotfiles
    );
    for (const file of files) {
      yield file;
    }
  }
}

export function createDirectoryReadingStream(
  initialDirectories: VerifiedDirectoryPath[],
  excludedNames: readonly string[],
  followSymlinks: boolean,
  includeDotfiles: boolean
): Readable {
  const generator = filePathGenerator(
    initialDirectories,
    excludedNames,
    followSymlinks,
    includeDotfiles
  );

  return Readable.from(generator);
}
