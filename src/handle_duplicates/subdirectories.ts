import path from 'path';
import fs from 'fs';
import {Path} from '../common/path';

// Returns true if the relative path indicates the same directory
// or a subdirectory of the directory it is relative to.
export const isSubdirectory = (relativePath: string): boolean =>
  relativePath === '' || !relativePath.trim().match(/^\.\./) ? true : false;

// Is file in dir or a subdirectory of dir?
export const fileIsInDirectoryOrSubdirectory = (
  file: Path,
  dir: Path
): boolean => {
  const realFilePath: string = fs.realpathSync(file);
  const realDirPath: string = fs.realpathSync(dir);
  const relativePath: string = path.relative(realDirPath, realFilePath);
  return isSubdirectory(relativePath);
};
