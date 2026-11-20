# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## Unreleased

### Added

- `watcher.dependencies` now applies to ignored dependencies: a change below a
  path listed in `watcher.ignore` marks its dependent file changed.
- `watcher.dependencies` is transitive: a file marked changed by a dependency
  edge is itself a dependency for the next edge.
- Dependents of a file discovered through HMR (an importer of the changed
  file) are marked changed, and an importer that also changed is invalidated
  once per batch.

## 4.0.5 - 2026-11-19

### Fixed

- `watcher.ignore` no longer hides paths from the source scan [#885](https://github.com/lumeland/lume/pull/885/).

## 1.0.4 - 2026-11-08

### Added

- `Path.*` static methods with common `posix` utils (join, basename, etc).
- `Path.fromFileUrl` and `Path.toFileUrl` static methods.

### Fixed

- Watcher: remove the root of the paths before checking the ignore conditions.

## 1.0.3 - 2026-11-04

### Fixed

- `emptyDest` removed only the first entry of the dest folder [#3](https://codeberg.org/lume/lume/pulls/3).

## 1.0.2 - 2026-11-01

### Fixed

- Archetypes: URLs are not downloaded as binary files.
- Archetypes: Allow to run unregistered archetypes.
- Archetypes: Print relative paths of the created files.

## 1.0.1 - 2026-10-31

### Fixed

- `getFsFiles()` cdn util returns wrong `file:` urls.

## 1.0.0 - 2026-10-30

First version
