# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/)
and this project adheres to [Semantic Versioning](https://semver.org/).

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
