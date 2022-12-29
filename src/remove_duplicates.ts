// Copyright (c) 2022, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import PS from 'prompt-sync';
import {deleteFile} from './delete_file';
import {fileIsInDirectoryOrSubdirectory} from './directories';
import {showDuplicates, showTotalDeleted} from './display';
const prompt = PS({sigint: true});

export const fileIsInADeleteDirectory = (
  file: string,
  dirsToAutomaticallyDeleteFrom: string[]
): boolean =>
  dirsToAutomaticallyDeleteFrom.some((dir: string) =>
    fileIsInDirectoryOrSubdirectory(file, dir)
  );

export const deleteOrListDuplicates = (
  duplicateFiles: string[][],
  dirsToAutomaticallyDeleteFrom: string[],
  reallyDelete: boolean,
  interactiveDeletion: boolean
) => {
  let [totalDeleted, numberOfDuplicatesInThisSetDeleted] = [0, 0];
  const deleteCallback = () => {
    numberOfDuplicatesInThisSetDeleted += 1;
    totalDeleted += 1;
  };

  duplicateFiles.forEach((duplicatesList: string[]) => {
    showDuplicates(duplicatesList);
    numberOfDuplicatesInThisSetDeleted = 0;
    const numDuplicatesInThisSet = duplicatesList.length;
    const remainingUndeletedFiles: string[] = [];

    // Be aware of when there is only one copy of a file left.
    const thereIsOnlyOneInstanceOfThisFileContent = (): boolean =>
      numDuplicatesInThisSet - numberOfDuplicatesInThisSetDeleted <= 1;

    // Automatic deletion
    duplicatesList.forEach((file: string) => {
      // Don't ever delete a unique file or the last copy of a file.
      if (thereIsOnlyOneInstanceOfThisFileContent()) return;
      if (fileIsInADeleteDirectory(file, dirsToAutomaticallyDeleteFrom)) {
        deleteFile(reallyDelete, file, deleteCallback, true);
        return;
      }
      remainingUndeletedFiles.push(file);
    });

    // Interactive deletion
    if (!interactiveDeletion) return;
    remainingUndeletedFiles.forEach((file: string) => {
      if (thereIsOnlyOneInstanceOfThisFileContent()) return;
      const rm = prompt(`Delete ${file}? ('y' deletes it) > `);
      if (rm === 'y') deleteFile(reallyDelete, file, deleteCallback);
    });
  });
  showTotalDeleted(totalDeleted);
};
