# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]
### Fixed
- Rebuild and reload on change `_data` files
- Explorer returns wrong results

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

[Unreleased]: https://github.com/oscarotero/lume/compare/v0.2.3...HEAD
[0.2.3]: https://github.com/oscarotero/lume/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/oscarotero/lume/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/oscarotero/lume/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/oscarotero/lume/compare/v0.1.0...v0.2.0
