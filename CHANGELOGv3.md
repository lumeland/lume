# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project try to adheres to [Semantic Versioning](https://semver.org/).
Go to the `v1` branch to see the changelog of Lume 1.

## 3.0.0 - Unreleased
### Added
- `await` filter for nunjucks.
- New option `cssFile` and `jsFile` to configure a default file for automatic generated code.
  It's used by default by code_highlight, google_fonts, prism and unocss.
  It's also used by default by components.

### Removed
- `jsx_preact` plugin. Use `jsx` instead.
- `site.copyRemainingFiles()`. 

### Changed
- Refactor source.build function to give priority to load over copy statically.
- Lume's components are now async.
- `jsx` plugin uses SSX library instead of React.
- `mdx` plugin no longer depends on a `jsx` plugin installed before.
- Upgraded tailwind to v4 and removed the dependency on `postcss` plugin.
- Replaced events-based operations with processors in the plugins
  check_urls, code_highlight, decap_cms, favicon, feed, google_fonts, icons, prism, robots, sitemap and slugify_urls.
- `metas` plugin: `generator` property is `true` by default.
