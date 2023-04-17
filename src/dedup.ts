// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

import {getFindDuplicatesStream} from './find_duplicates/duplicates';
import {getHandleDuplicatesStream} from './handle_duplicates/remove_duplicates';
import {hashAllCandidateFiles} from './hash_file/hash_files';
import {getCandidateFilesStream} from './candidate_files/get_candidate_files';
import {VerifiedDirectoryPath} from './common/verified_directory_path';
import {pipeline} from 'node:stream';
import {promisify} from 'util';

export type DedupOptions = {
  /** Directories subject to automatic deletion */
  dirsToPossiblyDeleteFrom: VerifiedDirectoryPath[];
  /** Ignore directories and files with these names */
  exclude: readonly string[];
  /** Follow symbolic links (or ignore them) */
  followSymlinks: boolean;
  /** Read files and directories that begin with a . such as .git (or ignore them) */
  includeDotfiles: boolean;
  /** Interactively delete remaining files after any automatic deletion is complete */
  interactiveDeletion: boolean;
  /** Use the shasum command line tool to hash files instead of node's crypto library (not recommended) */
  commandLineHashing: boolean;
  /** Directories to traverse in searching for duplicates dirsToPossiblyDeleteFrom will also be traversed */
  pathsToTraverse: VerifiedDirectoryPath[];
  /** Really delete files or just do a dry run? */
  reallyDelete: boolean;
};

/**
 * Given one or more directories, traverse them fully, finding all duplicate
 * files. Print out these duplicates or optionally delete them depending on the
 * exact options provided.
 *
 * @param options - Options that govern how the deduplication will proceed.
 *        @see DedupOptions
 */

export async function dedup(options: Readonly<DedupOptions>): Promise<void> {
  const candidateFilesStream = getCandidateFilesStream(options);

  const hashDataStream = await hashAllCandidateFiles(
    options.commandLineHashing
  );

  const handleDuplicatesStream = getHandleDuplicatesStream(
    options.dirsToPossiblyDeleteFrom,
    options.reallyDelete,
    options.interactiveDeletion
  );

  const pipelineAsync = promisify(pipeline);
  try {
    await pipelineAsync(
      candidateFilesStream,
      hashDataStream,
      getFindDuplicatesStream(),
      handleDuplicatesStream
    );
    console.log('Done!');
  } catch (err) {
    if ((err as {message: string}).message === 'exit requested') {
      console.log('Exiting');
    }
  }
}
