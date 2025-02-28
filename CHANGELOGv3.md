# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project try to adheres to [Semantic Versioning](https://semver.org/).
Go to the `v1` branch to see the changelog of Lume 1.

## 3.0.0 - Unreleased
### Added
- `site.add()` support URLs and NPM specifiers.
- `await` filter for nunjucks.
- New option `cssFile` and `jsFile` to configure a default file for automatic generated code.
  It's used by default by code_highlight, google_fonts, prism and unocss.
  It's also used by default by components.
- New folder-based components.
- Components: allow to define default data values in components.
- `page.text` and `page.bytes` getters and setters.
- `site.process(callback)` as an alias of `site.process("*", callback)`.
- `site.preprocess(callback)` as an alias of `site.preprocess("*", callback)`.
- `Server` class is now compatible with `deno serve` command.
- New data merging strategy named `data`, used by the multilanguage plugin.
- `slugify_urls` plugin: new `transliterate` option to define a different library per language.

### Removed
- `jsx_preact` plugin. Use `jsx` instead.
- `liquid` plugin. Use `nunjucks` instead.
- `site.copyRemainingFiles()` and `site.copy()`. Use `site.add()` instead.
- Automatic `<!doctype html>` to all HTML pages.
- `extensions` option of the plugins `check_urls`, `base_path`, `code_highlight`, `fff`, `inline`, `json_ld`, `katex`, `metas`, `multilanguage`, `og_images`, `prism`, `purgecss`, `relative_urls`, `postcss`, `lightningcss`, `sass`, `svgo`, `filter_pages`.
- `name` option of the plugins: `date`, `json_ld`, `metas`, `nav`, `paginate`, `picture`, `reading_info`, `search`, `transform_images`, `url`, `postcss`.
- `site.loadAssets()` function. Use `site.add()` instead.
- `on_demand` plugin and middleware. If you need some server-side logic, you can use router middleware.
- `inline` plugin: removed the `attribute` option. 
- `cache` option in `transform_images`, `favicon` and `og_images`. Use `LUME_NOCACHE=true` env variable to disable cache.
- `variable` option of Lume components. It's always `comp`.
- `name` special variable of components to customize the name. It's always the filename.

### Changed
- `Temporal` API is enabled by default.
- Minimum Deno version supported is LTS (2.1.0)
- Refactor source.build function to give priority to load over copy statically.
- Always load files with extensions that need to be (pre)processed instead copy them.
- Lume's components are now async.
- `jsx` plugin uses SSX library instead of React.
- `mdx` plugin no longer depends on a `jsx` plugin installed before.
- Upgraded `tailwind` to v4 and removed the dependency on `postcss` plugin.
- Replaced events-based operations with processors in the plugins
  code_highlight, decap_cms, favicon, feed, google_fonts, icons, prism, robots, sitemap and slugify_urls.
- `metas` plugin: `generator` property is `true` by default.
- `page.document` always returns a Document or throws and exception.
- Refactor of `esbuild` plugin to use `esbuild-deno-loader` to resolve and load jsr and npm dependencies.
- `transform_images` and `picture` plugins no longer load all images by default. Use `site.add()`.
  - Only the images that must be transformed are loaded.
- `decap_cms`: create the admin html page once.
- `postcss`, `sass`, `tailwindcss`, `unocss` and `lightningcss`, plugins no longer load all CSS files by default. Use `site.add()`.
- `svgo` plugin no longer load all SVG files by default. Use `site.add()`.
- `terser` and `esbuild` plugins no longer load all JS and TS files by default. Use `site.add()`.
- `esbuild` bundles jsx and tsx files by default.
- `sitemap` plugin: changed the options for something similar to `feed` and `metas`.
- The basename variable reflects always the final URL instead of the original file #660.
- Page generators can define the basename instead of the full URL to modify only the last part of the URL.

### Fixed
- The resolution of npm and jsr specifiers by esbuild plugin have been improved.
- Merging of multilanguage variables.
- Parsing the escaped URLs in CSS files. 
