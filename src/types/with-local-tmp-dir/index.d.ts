declare module 'with-local-tmp-dir' {
  type ResetFunction = () => Promise<void>;
  function withLocalTmpDir(): Promise<ResetFunction>;
  export = withLocalTmpDir;
}
