declare module 'output-files' {
  interface Directory {
    [filename: string]: Directory | string;
  }
  function outputFiles(files: Directory): Promise<void>;
  export = outputFiles;
}
