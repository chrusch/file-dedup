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

export function getHandleDuplicatesStream(
  dirsToAutomaticallyDeleteFrom: VerifiedDirectoryPath[],
  reallyDelete: boolean,
  interactiveDeletion: boolean
): Writable {
  let [totalDeleted, numberOfDuplicatesInThisSetDeleted] = [0, 0];
  const deletionRecordKeeping = () => {
    numberOfDuplicatesInThisSetDeleted += 1;
    totalDeleted += 1;
  };
  const autoDeletion = dirsToAutomaticallyDeleteFrom.length > 0;
  const handleDuplicatesStream = new Writable({
    objectMode: true,
    write(duplicatesList, _encoding, callback) {
      if (duplicatesList.length === 0) {
        return;
      }
      showDuplicates(duplicatesList);
      numberOfDuplicatesInThisSetDeleted = 0;
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
      if (interactiveDeletion) {
        remainingUndeletedFiles.forEach((file: Path) => {
          if (thereIsOnlyOneInstanceOfThisFileContent()) return;
          if (confirmDelete(file)) {
            deletionRecordKeeping();
            deleteFile(reallyDelete, file);
          }
        });
      }

      callback();
    },
  }).on('finish', () => {
    showTotalDeleted(totalDeleted, reallyDelete);
  });
  return handleDuplicatesStream;
}
