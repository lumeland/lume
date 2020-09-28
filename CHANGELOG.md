# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [0.6.0] - 2020-09-28
### Added
- New argument to `search.pages()` to sort pages alphabetically
- Added new argument `--help` and aliases `-h` and `-V` to cli
- Added `eta` plugin, to support `Eta` template engine
- New function `helper` to assign global helpers that can be used in the templates

### Removed
- Arguments `path` and `recursive` in `search.pages()`

### Fixed
- `url` filter with relative urls
- postcss incompatibility with deno

## [0.5.1] - 2020-09-25
### Fixed
- `version` variable

## [0.5.0] - 2020-09-24
### Added
- Ability to generate multiple pages using generators

### Changed
- Replaced `pathPrefix` and `url` with `location`

### Fixed
- `url` filter bugs

## [0.4.0] - 2020-09-22
### Added
- Ability to include the date in the filename
- New function `search.folder()`
- New option `--dev` to run in development mode

### Fixed
- Front matter detection
- Site rebuild after creating or removing directories and files
- Improved url filter
- Use content hash to detect real file changes
- Tags propagation
- Ensure beforeRender transformers are executed only once.

## [0.3.1] - 2020-09-19
### Fixed
- Use temporarily a fork of denjunks because loading bugs

## [0.3.0] - 2020-09-19
### Added
- New plugin `svg` to optimize svg files
- New plugin `dom` to manipulate html using the DOM api
- New filter `classname` to manipulate css classes
- New filter `attributes` to manipulate html attributes
- First tests

### Changed
- `explorer` was renamed to `search`

### Fixed
- Refactored source load and reload
- Explorer returns wrong results
- Live-reload bugs

## [0.2.3] - 2020-09-14
### Fixed
- Moved websocket script to server.js to avoid read problems

## [0.2.2] - 2020-09-13
### Added
- New command `lumen --version`

### Fixed
- CLI installation

## [0.2.1] - 2020-09-13
### Fixed
- Module loader execute from remote (http://deno.land/x/lume)
- Use fixed versions for dependencies

## [0.2.0] - 2020-09-13
### Added
- New command `lume --init` to create a `_config.js` file.

### Changed
- Merged `postcss` and `stylecow` plugins in the new `css` plugin.

### Fixed
- JSX engine

## 0.1.0 - 2020-09-13
First version

[0.6.0]: https://github.com/oscarotero/lume/compare/v0.5.1...v0.6.0
[0.5.1]: https://github.com/oscarotero/lume/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/oscarotero/lume/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/oscarotero/lume/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/oscarotero/lume/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/oscarotero/lume/compare/v0.2.3...v0.3.0
[0.2.3]: https://github.com/oscarotero/lume/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/oscarotero/lume/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/oscarotero/lume/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/oscarotero/lume/compare/v0.1.0...v0.2.0
