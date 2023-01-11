// Copyright (c) 2022, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {deleteFile} from './delete_file';
import {fileIsInDirectoryOrSubdirectory} from './directories';
import {showDuplicates, showTotalDeleted} from './display';
import {confirmDelete} from './interaction';

export const fileIsInADeleteDirectory = (
  file: string,
  dirsToAutomaticallyDeleteFrom: readonly string[]
): boolean =>
  dirsToAutomaticallyDeleteFrom.some((dir: string) =>
    fileIsInDirectoryOrSubdirectory(file, dir)
  );

// We have a list of duplicate files. Now we have to do something with them.
// Either delete them (whether automatically or interactively) or simply
// display them.
export const deleteOrListDuplicates = (
  duplicateFiles: readonly string[][],
  dirsToAutomaticallyDeleteFrom: readonly string[],
  reallyDelete: boolean,
  interactiveDeletion: boolean
): void => {
  let [totalDeleted, numberOfDuplicatesInThisSetDeleted] = [0, 0];
  const deletionRecordKeeping = () => {
    numberOfDuplicatesInThisSetDeleted += 1;
    totalDeleted += 1;
  };
  const autoDeletion = dirsToAutomaticallyDeleteFrom.length > 0;

  duplicateFiles.forEach((duplicatesList: string[]) => {
    showDuplicates(duplicatesList);
    numberOfDuplicatesInThisSetDeleted = 0;
    const numDuplicatesInThisSet = duplicatesList.length;
    const remainingUndeletedFiles: string[] = [];

    // Be aware of when there is only one copy of a file left.
    const thereIsOnlyOneInstanceOfThisFileContent = (): boolean =>
      numDuplicatesInThisSet - numberOfDuplicatesInThisSetDeleted <= 1;

    // Automatic deletion
    if (autoDeletion) {
      duplicatesList.forEach((file: string) => {
        // Don't ever delete a unique file or the last copy of a file.
        if (thereIsOnlyOneInstanceOfThisFileContent()) return;
        if (fileIsInADeleteDirectory(file, dirsToAutomaticallyDeleteFrom)) {
          deletionRecordKeeping();
          deleteFile(reallyDelete, file);
          return;
        }
        remainingUndeletedFiles.push(file);
      });
    } else {
      remainingUndeletedFiles.push(...duplicatesList);
    }

    // Interactive deletion
    if (!interactiveDeletion) return;
    remainingUndeletedFiles.forEach((file: string) => {
      if (thereIsOnlyOneInstanceOfThisFileContent()) return;
      if (confirmDelete(file)) {
        deletionRecordKeeping();
        deleteFile(reallyDelete, file);
      }
    });
  });
  showTotalDeleted(totalDeleted, reallyDelete);
};
