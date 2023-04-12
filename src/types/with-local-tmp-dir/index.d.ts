// Copyright (c) 2022-2023, Clayton Chrusch
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree.

declare module 'with-local-tmp-dir' {
  type ResetFunction = () => Promise<void>;
  function withLocalTmpDir(): Promise<ResetFunction>;
  export = withLocalTmpDir;
}
