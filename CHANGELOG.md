# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Supports generator/iterator functions, by [@compulim](https://github.com/compulim), in PR [#34](https://github.com/compulim/message-port-rpc/pull/34)

### Changed

- 💢 Moved build tools from Babel to tsup/esbuild
- Integration tests ported to mocha for better test conclusiveness, in PR [#40](https://github.com/compulim/message-port-rpc/pull/40)
- Bumped dependencies, by [@compulim](https://github.com/compulim), in PR [#29](https://github.com/compulim/message-port-rpc/pull/29), [#30](https://github.com/compulim/message-port-rpc/pull/30), [#38](https://github.com/compulim/message-port-rpc/pull/38), and [#42](https://github.com/compulim/message-port-rpc/pull/42)
   - Production dependencies
      - [`@babel/runtime-corejs3@7.24.1`](https://npmjs.com/package/@babel/runtime-corejs3)
   - Development dependencies
      - [`@babel/cli@7.24.1`](https://npmjs.com/package/@babel/cli)
      - [`@babel/core@7.24.3`](https://npmjs.com/package/@babel/core)
      - [`@babel/plugin-transform-runtime@7.24.3`](https://npmjs.com/package/@babel/plugin-transform-runtime)
      - [`@babel/preset-env@7.24.7`](https://npmjs.com/package/@babel/preset-env/v/7.24.7)
      - [`@babel/preset-react@7.24.6`](https://npmjs.com/package/@babel/preset-react/v/7.24.6)
      - [`@babel/preset-typescript@7.24.7`](https://npmjs.com/package/@babel/preset-typescript/v/7.24.7)
      - [`@tsconfig/recommended@1.0.6`](https://npmjs.com/package/@tsconfig/recommended/v/1.0.6)
      - [`@tsconfig/strictest@2.0.5`](https://npmjs.com/package/@tsconfig/strictest/v/2.0.5)
      - [`@types/jest@29.5.12`](https://npmjs.com/package/@types/jest)
      - [`@types/node@20.14.9`](https://npmjs.com/package/@types/node/v/20.14.9)
      - [`@types/react-dom@18.3.0`](https://npmjs.com/package/@types/react-dom/v/18.3.0)
      - [`@types/react@18.3.3`](https://npmjs.com/package/@types/react/v/18.3.3)
      - [`@typescript-eslint/eslint-plugin@7.4.0`](https://npmjs.com/package/@typescript-eslint/eslint-plugin)
      - [`@typescript-eslint/parser@7.4.0`](https://npmjs.com/package/@typescript-eslint/parser)
      - [`esbuild@0.21.4`](https://npmjs.com/package/esbuild/v/0.21.4)
      - [`esbuild@0.21.5`](https://npmjs.com/package/esbuild/v/0.21.5)
      - [`eslint-plugin-prettier@5.1.3`](https://npmjs.com/package/eslint-plugin-prettier)
      - [`eslint-plugin-react@7.34.1`](https://npmjs.com/package/eslint-plugin-react)
      - [`eslint@8.57.0`](https://npmjs.com/package/eslint)
      - [`jest@29.7.0`](https://npmjs.com/package/jest)
      - [`prettier@3.3.2`](https://npmjs.com/package/prettier/v/3.3.2)
      - [`react-dom@18.3.1`](https://npmjs.com/package/react-dom/v/18.3.1)
      - [`react@18.3.1`](https://npmjs.com/package/react/v/18.3.1)
      - [`tsup@8.1.0`](https://npmjs.com/package/tsup/v/8.1.0)
      - [`typescript@5.5.2`](https://npmjs.com/package/typescript/v/5.5.2)
      - [`use-ref-from@0.1.0`](https://npmjs.com/package/use-ref-from/v/0.1.0)
- Updated pull request validation to test against various React versions, in PR [#33](https://github.com/compulim/message-port-rpc/pull/33)
   - Moved from JSX Runtime to JSX Classic to support testing against React 16
- Added [ESLint import/export syntax](https://npmjs.com/package/eslint-plugin-import), in PR [#43](https://github.com/compulim/message-port-rpc/pull/43)
- Added [`publint`](https://npmjs.com/package/publint), in PR [#43](https://github.com/compulim/message-port-rpc/pull/43)
- Bumped dependencies, in PR [#45](https://github.com/compulim/message-port-rpc/pull/45)
  - Development dependencies
    - [`@babel/preset-env@7.25.8`](https://npmjs.com/package/@babel/preset-env/v/7.25.8)
    - [`@babel/preset-typescript@7.25.7`](https://npmjs.com/package/@babel/preset-typescript/v/7.25.7)
    - [`@tsconfig/recommended@1.0.7`](https://npmjs.com/package/@tsconfig/recommended/v/1.0.7)
    - [`@types/jest@29.5.13`](https://npmjs.com/package/@types/jest/v/29.5.13)
    - [`@types/node@22.7.5`](https://npmjs.com/package/@types/node/v/22.7.5)
    - [`@types/react@18.3.11`](https://npmjs.com/package/@types/react/v/18.3.11)
    - [`@types/react-dom@18.3.1`](https://npmjs.com/package/@types/react-dom/v/18.3.1)
    - [`@typescript-eslint/eslint-plugin@8.8.1`](https://npmjs.com/package/@typescript-eslint/eslint-plugin/v/8.8.1)
    - [`@typescript-eslint/parser@8.8.1`](https://npmjs.com/package/@typescript-eslint/parser/v/8.8.1)
    - [`esbuild@0.24.0`](https://npmjs.com/package/esbuild/v/0.24.0)
    - [`eslint@9.12.0`](https://npmjs.com/package/eslint/v/9.12.0)
    - [`eslint-plugin-prettier@5.2.1`](https://npmjs.com/package/eslint-plugin-prettier/v/5.2.1)
    - [`eslint-plugin-react@7.37.1`](https://npmjs.com/package/eslint-plugin-react/v/7.37.1)
    - [`mocha@10.7.3`](https://npmjs.com/package/mocha/v/10.7.3)
    - [`prettier@3.3.3`](https://npmjs.com/package/prettier/v/3.3.3)
    - [`tsup@8.3.0`](https://npmjs.com/package/tsup/v/8.3.0)
    - [`typescript@5.6.3`](https://npmjs.com/package/typescript/v/5.6.3)

### Removed

- 💢 Removed named exports, please import the defaults instead
   - Use `import { messagePortRPC } from 'message-port-rpc'` instead

## [1.0.1] - 2023-10-09

### Changed

- Updates `tsconfig.json` to extend from [`@tsconfig/strictest`](https://npmjs.com/package/@tsconfig/strictest), by [@compulim](https://github.com/compulim), in PR [#8](https://github.com/compulim/message-port-rpc/pull/8) and PR [#9](https://github.com/compulim/message-port-rpc/pull/9)
- Bumped dependencies, by [@compulim](https://github.com/compulim), in PR [#17](https://github.com/compulim/message-port-rpc/pull/17), and PR [#26](https://github.com/compulim/message-port-rpc/pull/26)
   - Production dependencies
      - [`@babel/runtime-corejs3@7.23.1`](https://npmjs.com/package/@babel/runtime-corejs3)
   - Development dependencies
      - [`@babel/cli@7.23.0`](https://npmjs.com/package/@babel/cli)
      - [`@babel/core@7.23.0`](https://npmjs.com/package/@babel/core)
      - [`@babel/plugin-transform-runtime@7.22.15`](https://npmjs.com/package/@babel/plugin-transform-runtime)
      - [`@babel/preset-env@7.22.20`](https://npmjs.com/package/@babel/preset-env)
      - [`@babel/preset-typescript@7.23.0`](https://npmjs.com/package/@babel/preset-typescript)
      - [`@jest/globals@29.7.0`](https://npmjs.com/package/@jest/globals)
      - [`@tsconfig/recommended@1.0.3`](https://npmjs.com/package/@tsconfig/recommended)
      - [`@types/jest@29.5.5`](https://npmjs.com/package/@types/jest)
      - [`@types/node@20.8.3`](https://npmjs.com/package/@types/node)
      - [`@typescript-eslint/eslint-plugin@6.7.4`](https://npmjs.com/package/@typescript-eslint/eslint-plugin)
      - [`@typescript-eslint/parser@6.7.4`](https://npmjs.com/package/@typescript-eslint/parser)
      - [`esbuild@0.19.4`](https://npmjs.com/package/esbuild)
      - [`eslint-plugin-react@7.33.2`](https://npmjs.com/package/eslint-plugin-react)
      - [`eslint@8.51.0`](https://npmjs.com/package/eslint)
      - [`jest@29.7.0`](https://npmjs.com/package/jest)
      - [`prettier@3.0.3`](https://npmjs.com/package/prettier)
      - [`typescript@5.2.2`](https://npmjs.com/package/typescript)

### Fixed

- Updated `exports` field to workaround [TypeScript resolution bug](https://github.com/microsoft/TypeScript/issues/50762), by [@compulim](https://github.com/compulim), in PR [#7](https://github.com/compulim/message-port-rpc/pull/7)

## [1.0.0] - 2023-05-14

### Added

- First public release

[Unreleased]: https://github.com/compulim/message-port-rpc/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/compulim/message-port-rpc/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/compulim/message-port-rpc/releases/tag/v1.0.0
