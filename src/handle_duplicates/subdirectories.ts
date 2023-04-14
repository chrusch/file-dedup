import path from 'path';
import fs from 'fs/promises';
import {Path} from '../common/path';

/**
 * Returns true if the relative path points to the same directory or a subdirectory of the directory it is relative to.
 *
 * @param relativePath - A relative path (see path.relative)
 * @returns True or false depending on whether the relativePath is the same directory or a subdirectory of its base path
 */
export const isSubdirectory = (relativePath: string): boolean =>
  relativePath === '' || !relativePath.trim().match(/^\.\./) ? true : false;

/**
 * Is the given file in the given directory?
 *
 * @param file - A path to a file/directory/etc.
 * @param directory - A path to a directory.
 * @returns A promise resolving to a boolean indicating whether the given file is in the given directory. The promise resolves to true if the given file is identical to the given directory
 */
export const fileIsInDirectoryOrSubdirectory = async (
  file: Path,
  directory: Path
): Promise<boolean> => {
  const realFilePath: string = await fs.realpath(file);
  const realDirPath: string = await fs.realpath(directory);
  const relativePath: string = path.relative(realDirPath, realFilePath);
  return isSubdirectory(relativePath);
};
