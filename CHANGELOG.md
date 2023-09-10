# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Updates `tsconfig.json` to extend from [`@tsconfig/strictest`](https://npmjs.com/package/@tsconfig/strictest), by [@compulim](https://github.com/compulim), in PR [#8](https://github.com/compulim/message-port-rpc/pull/8) and PR [#9](https://github.com/compulim/message-port-rpc/pull/9)
- Bumped dependencies, by [@compulim](https://github.com/compulim), in PR [#17](https://github.com/compulim/message-port-rpc/pull/17)
   - Production dependencies
      - [`@babel/runtime-corejs3@7.22.15`](https://npmjs.com/package/@babel/runtime-corejs3)
   - Development dependencies
      - [`@typescript-eslint/eslint-plugin@6.6.0`](https://npmjs.com/package/@typescript-eslint/eslint-plugin)
      - [`@typescript-eslint/parser@6.6.0`](https://npmjs.com/package/@typescript-eslint/parser)
      - [`eslint@8.49.0`](https://npmjs.com/package/eslint)
      - [`eslint-plugin-react@7.33.2`](https://npmjs.com/package/eslint-plugin-react)
      - [`prettier@3.0.3`](https://npmjs.com/package/prettier)
      - [`@babel/cli@7.22.15`](https://npmjs.com/package/@babel/cli)
      - [`@babel/core@7.22.17`](https://npmjs.com/package/@babel/core)
      - [`@babel/plugin-transform-runtime@7.22.15`](https://npmjs.com/package/@babel/plugin-transform-runtime)
      - [`@babel/preset-env@7.22.15`](https://npmjs.com/package/@babel/preset-env)
      - [`@babel/preset-typescript@7.22.15`](https://npmjs.com/package/@babel/preset-typescript)
      - [`@jest/globals@29.6.4`](https://npmjs.com/package/@jest/globals)
      - [`@types/jest@29.5.4`](https://npmjs.com/package/@types/jest)
      - [`@types/node@20.6.0`](https://npmjs.com/package/@types/node)
      - [`esbuild@0.19.2`](https://npmjs.com/package/esbuild)
      - [`jest@29.6.4`](https://npmjs.com/package/jest)
      - [`prettier@3.0.3`](https://npmjs.com/package/prettier)
      - [`typescript@5.2.2`](https://npmjs.com/package/typescript)

### Fixed

- Updated `exports` field to workaround [TypeScript resolution bug](https://github.com/microsoft/TypeScript/issues/50762), by [@compulim](https://github.com/compulim), in PR [#7](https://github.com/compulim/message-port-rpc/pull/7)

## [1.0.0] - 2023-05-14

### Added

- First public release
