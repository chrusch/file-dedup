# file-dedup
Deduplicate files on your hard drive.

## Usage
In the project root directory, run:

```
yarn install
yarn run compile
node build/src/index.js [-h] [-i] [-d] [-l] [-c] [-p <paths...> --] [--reallyDelete] <dir...>
```

### Arguments
```
  dir                     Directories to look for duplicates files in. The
                          command will also look in the directories specified
                          using the --paths option. Zero-length files are
                          always ignored.
```

### Options:
```
  -v, --version           Output the version number.

  -p, --paths <paths...>  Automatically (non-interactively) delete duplicates in
                          the given directories. To actually delete files, also
                          provide --reallyDelete; otherwise the command will
                          only display which files would have been deleted. This
                          command will always leave at least one instance of
                          every duplicate file. Be careful with this option!

  -i, --interactive       Interactively prompt to delete files. To actually
                          delete files, also provide --reallyDelete; otherwise
                          the command will only display files that would have
                          been deleted. This command will always leave at least
                          one instance of every duplicate file.

  -d, --dotFiles          By default, files and directories whose names begin
                          with "." are ignored. Use this option to override this
                          behavior.

  --reallyDelete          Really delete duplicate files. By default this command
                          displays which duplicate files would be deleted, but
                          does not actually delete files. Use this option to
                          actually delete files.

  -h, --help              Display help for command.

  -l, --followSymlinks    By default, symlinks are ignored while traversing
                          directories. Use this option to override this behavior.

  -c, --commandLineHashing  To find duplicate files, this program calculates the
                          SHA256 hash digest of each file. If you specify
                          --commandLineHashing, this program will use the shasum
                          command found on your system instead of calculating the
                          hash using node's built-in crypto library. If the
                          shasum command cannot be found, node's crypto library
                          will always be used. In most circumstances, it is
                          recommended not to use this option since your system's
                          shasum command is likely the slower implementation of
                          the two.
```

### Examples:

1. Show help:

```
node build/src/index.js -h
```

2. List all duplicate files in the /tmp directory:

```
node build/src/index.js /tmp
```

3. List all duplicate files in the /tmp directory and interactively delete
duplicates:

```
node build/src/index.js -i --reallyDelete /tmp
```

4. List all duplicate files in the /tmp directory and interactively select files
for deletion (but don't really delete):

```
node build/src/index.js -i /tmp
```

5. List all duplicate files in the /tmp directory and automatically delete
all duplicates in /tmp/foo:
```
node build/src/index.js -p /tmp/foo/ --reallyDelete /tmp
```

6. List all duplicate files in the /tmp and /usr/foo directories and automatically
delete all duplicates in /usr/foo:
```
node build/src/index.js -p /usr/foo/ --reallyDelete /tmp
```

7. List all duplicate files in the /tmp directory, including files and directories
that begin with '.', e.g. .gitignore. Note that that currently node_modules and
.git/ directories are always ignored:
```
node build/src/index.js -d /tmp
```

8. List all duplicate files in the /tmp1 /tmp2 /tmp3 and /tmp4 directories. List
also all duplicate files that would be automatically deleted in /tmp1 and /tmp2
if the --reallyDelete options were given:
```
node build/src/index.js -p /tmp1 /tmp2 -- /tmp3 /tmp4
```


## Motivation

This is a command-line utility for deduplicating files on a Mac-style
file system. I wrote it initially for my own use, but I suspect others may find
it useful. I hope to add more features and simplify the usage.

For the purposes of this command, two files are considered duplicates if they
are the same size and the SHA-256 sums of both files are identical.

## Build Status

I believe this code works as intended, but it is an early release. As of April
12, 2023, it has complete test coverage. Some known error conditions have not
been dealt with yet.

I cannot guarantee the absence of bugs. Always back up your files before
deduplicating. File-dedup has only been tested on a Mac.

## Tech

File-dedup is written entirely in typescript using node. It optionally depends
on the shasum command, which is likely already installed on your Mac.

File-dedup can be used as typescript library as well as a command-line utility.


