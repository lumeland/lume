# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project try to adheres to [Semantic Versioning](https://semver.org/).
Go to the `v1` branch to see the changelog of Lume 1.

## 3.0.0 - Unreleased
### Added
- `await` filter for nunjucks.

### Removed
- `jsx_preact` plugin. Use `jsx` instead.

### Changed
- Refactor source.build function to give priority to load over copy statically.
- Lume's components are now async.
- `jsx` plugin uses SSX library instead of React.
- `mdx` plugin no longer depends on a `jsx` plugin installed before.
