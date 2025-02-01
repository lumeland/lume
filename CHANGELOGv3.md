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
- `page.text` and `page.bytes` getters and setters.
- `site.add()` support URLs and NPM specifiers.
- `site.process(callback)` as an alias of `site.process("*", callback)`.
- `site.preprocess(callback)` as an alias of `site.preprocess("*", callback)`.

### Removed
- `jsx_preact` plugin. Use `jsx` instead.
- `liquid` plugin. Use `nunjucks` instead.
- `site.copyRemainingFiles()`.
- Automatic `<!doctype html>` to all HTML pages.
- `extensions` option of the plugins `check_urls`, `base_path`, `code_highlight`, `fff`, `inline`, `json_ld`, `katex`, `metas`, `multilanguage`, `og_images`, `prism`, `purgecss`, `relative_urls`, `postcss`, `lightningcss`.
- `name` option of the plugins: `date`, `json_ld`, `metas`, `nav`, `paginate`, `picture`, `reading_info`, `search`, `transform_images`, `url`, `postcss`.
- `site.loadAssets()` function. Use `site.add()` instead.
- `on_demand` plugin and middleware. If you need some server-side logic, you can use router middleware.

### Changed
- Minimum Deno version supported is LTS (2.1.0)
- Refactor source.build function to give priority to load over copy statically.
- Always load files with extensions that need to be (pre)processed instead copy them.
- Rename `site.copy()` to `site.add()`.
- Lume's components are now async.
- `jsx` plugin uses SSX library instead of React.
- `mdx` plugin no longer depends on a `jsx` plugin installed before.
- Upgraded tailwind to v4 and removed the dependency on `postcss` plugin.
- Replaced events-based operations with processors in the plugins
  code_highlight, decap_cms, favicon, feed, google_fonts, icons, prism, robots, sitemap and slugify_urls.
- `metas` plugin: `generator` property is `true` by default.
- `page.document` always returns a Document or throws and exception.
- Refactor of `esbuild` plugin to use `esbuild-deno-loader` to resolve and load jsr and npm dependencies.
- `transform_images` and `picture` plugins: only the images that must be transformed are loaded.
- `decap_cms`: create the admin html page once.
- `postcss` and `lightningcss` no longer load all CSS files by default. Use `site.add()`.
