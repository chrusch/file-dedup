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

export const fileIsInADeleteDirectory = (
  file: Path,
  dirsToAutomaticallyDeleteFrom: VerifiedDirectoryPath[]
): boolean =>
  dirsToAutomaticallyDeleteFrom.some(dir =>
    fileIsInDirectoryOrSubdirectory(file, aPath(dir))
  );

interface HandleDuplicatesListOptions {
  duplicatesList: Path[];
  trackTotalDeleted: () => void;
  reallyDelete: boolean;
  interactiveDeletion: boolean;
  autoDeletion: boolean;
  dirsToAutomaticallyDeleteFrom: VerifiedDirectoryPath[];
}

/**
 * Given a list of duplicates and other options, determine which files to
 * delete.
 */
function handleDuplicatesList(options: HandleDuplicatesListOptions) {
  const {
    duplicatesList,
    trackTotalDeleted,
    reallyDelete,
    interactiveDeletion,
    autoDeletion,
    dirsToAutomaticallyDeleteFrom,
  } = options;
  if (duplicatesList.length === 0) {
    return;
  }
  showDuplicates(duplicatesList);
  let numberOfDuplicatesInThisSetDeleted = 0;
  const doRecordKeeping = () => {
    trackTotalDeleted();
    numberOfDuplicatesInThisSetDeleted++;
  };
  const numDuplicatesInThisSet = duplicatesList.length;
  const remainingUndeletedFiles: Path[] = [];

  // Be aware of when there is only one copy of a file left.
  const thereIsOnlyOneInstanceOfThisFileContent = (): boolean =>
    numDuplicatesInThisSet - numberOfDuplicatesInThisSetDeleted <= 1;

  // Automatic deletion
  if (autoDeletion) {
    duplicatesList.forEach((file: Path) => {
      // Don't ever delete a unique file or the last copy of a file.
      if (thereIsOnlyOneInstanceOfThisFileContent()) return;
      if (fileIsInADeleteDirectory(file, dirsToAutomaticallyDeleteFrom)) {
        doRecordKeeping();
        deleteFile(reallyDelete, file);
        return;
      }
      remainingUndeletedFiles.push(file);
    });
  } else {
    remainingUndeletedFiles.push(...duplicatesList);
  }

  // Interactive deletion
  if (interactiveDeletion) {
    remainingUndeletedFiles.forEach((file: Path) => {
      if (thereIsOnlyOneInstanceOfThisFileContent()) return;
      if (confirmDelete(file)) {
        doRecordKeeping();
        deleteFile(reallyDelete, file);
      }
    });
  }
}

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
    write(duplicatesList, _encoding, done) {
      handleDuplicatesList({
        duplicatesList,
        trackTotalDeleted,
        reallyDelete,
        interactiveDeletion,
        autoDeletion,
        dirsToAutomaticallyDeleteFrom,
      });
      done();
    },
  }).on('finish', () => {
    showTotalDeleted(totalDeleted, reallyDelete);
  });
}
