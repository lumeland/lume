# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## 4.0.2 - 2026-11-08

### Fixed

- Ignore automatically all dot files and folders (except the `.well-known` folder), to prevent infinite refresh caused by some tools like `jj`. Previously, only the `.git` folder was ignored.
- Internal: rename `getOptionsFromCli` to `setOptionsFromCli`.

## 4.0.1 - 2026-11-03

### Fixed

- Error loading built-in archetypes.

## 4.0.0 - 2026-10-30

In this version, Lume was migrated from Deno to Node, and published on NPM as `@lumeland/lume`. See the blog posts or the migrating guide in the Lume website for more info.

### Added

- Improved archetypes with support for remote files and `overwrite` option.

### Removed

- `site.remoteFile()`. Use `site.remote()` instead.
- `options.watcher.includes` was removed.
- The option `includes` was removed. The includes folder is always `_includes` and can't be changed.

### Changes

- Remote files are cached in the `_cache` folder instead of using the Web Cache API (not available in Node).
- Only the default plugins are available (markdown, vento, json, yaml, url, search, paginate, etc). Other plugins must be installed separately, for example `npm install @lumeland/plugin-esbuild`.
- The command to run archetypes has renamed to `run`. For example `npx lume run new-plugin`.
