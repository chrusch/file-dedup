// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {deleteFile} from './delete_file';
import {fileIsInDirectoryOrSubdirectory} from './subdirectories';
import {showDuplicates, showTotalDeleted} from './display';
import {confirmDelete} from './interaction';
import {aPath, Path} from '../common/path';
import {VerifiedDirectoryPath} from '../common/verified_directory_path';
import {Writable} from 'node:stream';
import {some} from 'async';

/**
 * Is the given file in a directory that is subject to autoDeletion?
 *
 * @param file - Path to file
 * @param dirsToAutomaticallyDeleteFrom - A list of directories subject to autoDeletion
 * @returns A promise resolving to a boolean indicating whether the file is subject to autoDeletion
 */
export const fileIsInADeleteDirectory = (
  file: Path,
  dirsToAutomaticallyDeleteFrom: VerifiedDirectoryPath[]
): Promise<boolean> =>
  some(dirsToAutomaticallyDeleteFrom, async dir => {
    return await fileIsInDirectoryOrSubdirectory(file, aPath(dir));
  });

export interface HandleDuplicatesListOptions {
  duplicatesList: Path[];
  trackTotalDeleted: (file: Path) => void;
  reallyDelete: boolean;
  interactiveDeletion: boolean;
  autoDeletion: boolean;
  dirsToAutomaticallyDeleteFrom: VerifiedDirectoryPath[];
}

/**
 * Finally we have a list of duplicates! Now display them and optionally delete
 * them depending on the options provided and user input.
 *
 * @param duplicatesList - A list of files with identical contents
 * @param trackTotalDeleted - A function that counts the deleted files
 * @param reallyDelete - Really delete files or is this just a dry run?
 * @param interactiveDeletion - Let user decide which files are deleted?
 * @param autoDeletion - Should some files be automatically deleted?
 * @param dirsToAutomaticallyDeleteFrom - Directories subject to autoDeletion
 * @returns Void
 */
export async function handleDuplicatesList({
  duplicatesList,
  trackTotalDeleted,
  reallyDelete,
  interactiveDeletion,
  autoDeletion,
  dirsToAutomaticallyDeleteFrom,
}: HandleDuplicatesListOptions): Promise<void> {
  if (duplicatesList.length === 0) return;

  let numberOfDuplicatesInThisSetDeleted = 0;
  const doRecordKeeping = (file: Path) => {
    trackTotalDeleted(file);
    numberOfDuplicatesInThisSetDeleted++;
  };
  const numDuplicatesInThisSet = duplicatesList.length;
  const remainingUndeletedFiles: Path[] = [];

  // Be aware of when there is only one copy of a file left.
  const thereIsOnlyOneInstanceOfThisFileContent = (): boolean =>
    numDuplicatesInThisSet - numberOfDuplicatesInThisSetDeleted <= 1;

  showDuplicates(duplicatesList);

  // Automatic deletion
  if (autoDeletion) {
    for (const file of duplicatesList) {
      // Don't ever delete a unique file or the last copy of a file.
      if (thereIsOnlyOneInstanceOfThisFileContent()) return;
      if (await fileIsInADeleteDirectory(file, dirsToAutomaticallyDeleteFrom)) {
        doRecordKeeping(file);
        deleteFile(reallyDelete, file);
        continue;
      }
      remainingUndeletedFiles.push(file);
    }
  } else {
    remainingUndeletedFiles.push(...duplicatesList);
  }

  // Interactive deletion
  if (interactiveDeletion) {
    for (const file of remainingUndeletedFiles) {
      if (thereIsOnlyOneInstanceOfThisFileContent()) continue;
      if (await confirmDelete(file)) {
        doRecordKeeping(file);
        deleteFile(reallyDelete, file);
      }
    }
  }
}

/**
 * Returns a Writable stream that finally deals with the duplicates we found
 *
 * @param dirsToAutomaticallyDeleteFrom - Directories subject to autoDeletion
 * @param reallyDelete - Really delete files or is this just a dry run?
 * @param interactiveDeletion - Let user decide which files are deleted?
 * @returns Void
 */
export function getHandleDuplicatesStream(
  dirsToAutomaticallyDeleteFrom: VerifiedDirectoryPath[],
  reallyDelete: boolean,
  interactiveDeletion: boolean
): Writable {
  let totalDeleted = 0;
  const trackTotalDeleted = () => {
    totalDeleted++;
  };
  const autoDeletion = dirsToAutomaticallyDeleteFrom.length > 0;
  return new Writable({
    objectMode: true,
    write(duplicatesList: Path[], _encoding, done) {
      handleDuplicatesList({
        duplicatesList,
        trackTotalDeleted,
        reallyDelete,
        interactiveDeletion,
        autoDeletion,
        dirsToAutomaticallyDeleteFrom,
      })
        .then(() => done())
        .catch((error: {message: string}) => {
          if (error.message === 'exit requested') {
            this.emit('error', error);
          } else {
            // for now we emit an error regardless of what error is thrown
            // in the future, we might handle different errors differently
            // For example, there might be an error deleting a file if the
            // permissions of the file have changed, or if it is not readable or
            // if it has ceased to exist
            this.emit('error', error);
            // done();
          }
        });
    },
  }).on('finish', () => {
    showTotalDeleted(totalDeleted, reallyDelete);
  });
}
