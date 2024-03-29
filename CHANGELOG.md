# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Bumped dependencies, by [@compulim](https://github.com/compulim), in PR [#29](https://github.com/compulim/message-port-rpc/pull/29) and [#30](https://github.com/compulim/message-port-rpc/pull/30)
   - Production dependencies
      - [`@babel/runtime-corejs3@7.24.1`](https://npmjs.com/package/@babel/runtime-corejs3)
   - Development dependencies
      - [`@babel/cli@7.24.1`](https://npmjs.com/package/@babel/cli)
      - [`@babel/core@7.24.3`](https://npmjs.com/package/@babel/core)
      - [`@babel/plugin-transform-runtime@7.24.3`](https://npmjs.com/package/@babel/plugin-transform-runtime)
      - [`@babel/preset-env@7.24.3`](https://npmjs.com/package/@babel/preset-env)
      - [`@babel/preset-react@7.24.1`](https://npmjs.com/package/@babel/preset-react)
      - [`@babel/preset-typescript@7.24.1`](https://npmjs.com/package/@babel/preset-typescript)
      - [`@tsconfig/recommended@1.0.4`](https://npmjs.com/package/@tsconfig/recommended)
      - [`@tsconfig/strictest@2.0.4`](https://npmjs.com/package/@tsconfig/strictest)
      - [`@types/jest@29.5.12`](https://npmjs.com/package/@types/jest)
      - [`@types/node@20.11.30`](https://npmjs.com/package/@types/node)
      - [`@types/react-dom@18.2.22`](https://npmjs.com/package/@types/react-dom)
      - [`@types/react@18.2.70`](https://npmjs.com/package/@types/react)
      - [`@typescript-eslint/eslint-plugin@7.4.0`](https://npmjs.com/package/@typescript-eslint/eslint-plugin)
      - [`@typescript-eslint/parser@7.4.0`](https://npmjs.com/package/@typescript-eslint/parser)
      - [`esbuild@0.20.2`](https://npmjs.com/package/esbuild)
      - [`eslint-plugin-prettier@5.1.3`](https://npmjs.com/package/eslint-plugin-prettier)
      - [`eslint-plugin-react@7.34.1`](https://npmjs.com/package/eslint-plugin-react)
      - [`eslint@8.57.0`](https://npmjs.com/package/eslint)
      - [`jest@29.7.0`](https://npmjs.com/package/jest)
      - [`prettier@3.2.5`](https://npmjs.com/package/prettier)
      - [`typescript@5.4.3`](https://npmjs.com/package/typescript)

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

[1.0.1]: https://github.com/compulim/message-port-rpc/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/compulim/message-port-rpc/releases/tag/v1.0.0
