// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import pathModule from 'path';
import {Stats} from 'fs';
import {lstat, readdir, stat} from 'node:fs/promises';
import {aPath, Path} from '../common/path';
import {VerifiedDirectoryPath} from '../common/verified_directory_path';
import {Readable} from 'stream';

/**
 * Get the Stats object of a filesystem entity
 *
 * @param path - The path to the file
 * @param followSymlinks - Policy on following symlinks
 * @returns When the path is a symlink and followSymlinks is true, returns the
 *          Stats object of the linked file, otherwise returns the Stats of the
 *          literal file system entity indicated by path, whether file, symlink,
 *          directory, or whatever.
 */
export async function getFileStatus(
  path: Path,
  followSymlinks: boolean
): Promise<Stats> {
  return followSymlinks ? await stat(path) : await lstat(path);
}

/**
 * A Generator object that generates filepath.
 */
type DirGenerator = Generator<Path, void, Path[] | undefined | null>;

/**
 * Returns a Generator object that generates the paths of directories,
 * starting with initialDirectories
 *
 * @remarks
 *
 * This generator function is used in conjunction with filePathGenerator(). The
 * directories generated are (1) the initialDirectories and (2) the directories
 * provided by the consumer, filePathGenerator(). The directoryGenerator()
 * function acts as an iterable queue of directories to read.
 *
 * @param initialDirectories - Verified directories to begin generating
 * @returns A Generator object that generates directory paths
 */
export function* directoryGenerator(
  initialDirectories: VerifiedDirectoryPath[]
): DirGenerator {
  const directories: Path[] = [...initialDirectories.map(aPath)];

  while (directories.length > 0) {
    const nextDir = directories[0];
    // The following line communicates with the consumer. If newDirs is an array
    // of directories, the consumer is feeding us new information and by
    // convention we can assume it is ignoring nextDir, and so we will yield the
    // same nextDir in the next loop.
    const newDirs = yield nextDir;
    if (newDirs) {
      // Consumer is providing us with new directories.
      directories.push(...newDirs);
    } else {
      // Consumer has consumed nextDir.
      directories.shift();
    }
  }
}

/**
 * Read a directory and return the files in that directory.
 *
 * @remarks
 *
 * Has a side effect that newly discovered subdirectories are reported to
 * dirGenerator which functions as a queue of directories to read.
 *
 * Has another side effect of maintaining a set of inodes that have been stat'd
 * to avoid duplication of effort.
 *
 * @param dir - The directory to read
 * @param entriesRead - The set of inodes that have already been processed
 * @param dirGenerator - A generator that functions as a queue of directories to
 *        read
 * @param excludedNames - A list of file and directory names to ignore such as
 *        'node_modules'
 * @param followSymlinks - Policy on whether to follow or ignore symlinks.
 * @param includeDotfiles - Policy on whether to process or ignore files that
 *        begin with dot ('.')
 * @returns The paths and sizes of the files read.
 */
export async function readDirectory(
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
      // we have to assume here that dirGenerator has already had next() called
      // on it at least once, otherwise a directory will be missed in the
      // next line of code
      dirGenerator.next([pth]);
    } else if (fileStatus.isFile()) {
      files.push([pth, fileStatus.size]);
    }
  }
  return files;
}

/**
 * Returns an AsyncGenerator that produces file paths obtained by traversing
 * initialDirectories.
 *
 * @param initialDirectories - The directories to traverse
 * @param excludedNames - The names of files and directories to ignore, e.g.
 *        node_modules
 * @param followSymlinks - Policy on whether to follow symlinks or ignore them
 * @param includeDotfiles - Policy on whether to process files and directories
 *        beginning with a dot or to ignore them
 * @returns An AsyncGenerator that produces file paths obtained by traversing
 * initialDirectories
 */
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
    files = await readDirectory(
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

/**
 * Returns a Readable stream that produces file paths obtained by traversing
 * initialDirectories.
 *
 * @remarks
 *
 * The returned stream is trivially created from an AsyncGenerator that does all
 * the work.
 *
 * @param initialDirectories - The directories to traverse
 * @param excludedNames - The names of files and directories to ignore, e.g.
 *        node_modules
 * @param followSymlinks - Policy on whether to follow symlinks or ignore them
 * @param includeDotfiles - Policy on whether to process files and directories
 *        beginning with a dot or to ignore them
 * @returns A Readable stream that produces file paths obtained by traversing
 *          initialDirectories
 */
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
