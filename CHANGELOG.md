# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project try to adheres to [Semantic Versioning](https://semver.org/).
Go to the `v2` branch to see the changelog of Lume 2.
Go to the `v1` branch to see the changelog of Lume 1.

## [3.0.9] - Unreleased
### Fixed
- `esbuild` plugin: Handle alias option.

## [3.0.8] - 2025-09-04
### Fixed
- `esbuild` plugin: Handle external and node built-in modules.
- Make sure development middlewares are registered at the begining.
- Updated dependencies: `terser`, `sass`, `satori`, `std` and some icons.

## [3.0.7] - 2025-09-02
### Added
- `check_urls` plugin: New option `anchors` to check the URL hash.
- `filter_pages` plugin: New option `beforeRender` to filter the pages before rendering.
- `inline` plugin: New option `sourceURL` to add the `sourceURL=inline:...` pragma to inlined JS and CSS files [#779].
- `site.initDebugBar()` to initialize manually the `debugBar`.
- `gh:` specifier for `add()` and `copy()`, to use files from GitHub repositories.
- Allow to download several files from a GitHub or NPM package using glob patterns. For example `site.add("npm:ventojs/**")`.

### Fixed
- Issues running `site.build()` multiple times in the same process.
- `mergedKeys` key is not merged.
- Use `textContent` instead of `innerHTML` to get values using CSS selectors
  by some plugins like metas [#782]
- Updated [Vento to v2](https://lume.land/blog/posts/vento-2/).
- Updated dependencies: `bar`, `unocss`, `tailwindcss`, `esbuild`, `std`, `deno/loader`, `sass`, `xml`, `magic-string`, `satori`, `mdx`, `pagefind` and some icons.

## [3.0.6] - 2025-08-07
### Added
- New `idle` event, triggered when the `build` or `update` process has finished or stopped.
- New flag `--cms` for `deno task serve` to run the new experimental version of LumeCMS.
- `sheets` plugin: New option `outputOptions` to configure the output of the data.
- `prism` plugin: New `autoloadLanguages` option to load automatically the languages on demand.

### Changed
- `esbuild` plugin: use `jsr:@deno/loader` official package instead of `@luca/esbuild-deno-loader`.
- Middlewares configured in the `server.middlewares` option are registered before the dev middlewares.
- `--watch` and `--serve` modes don't exit if there's an error on build.
- `mdx` plugin: Now `stylePropertyNameCase` option is fixed to "css", ensuring generated HTML always uses kebab-case inline styles.
- Local server: when the port is not explicitly set and the default `3000` is in use, Lume will use the next available port (from `3001` to `3010`).

### Fixed
- Optimized file server by removing a `Deno.stat` call.
- `jsx` plugin: Support `precompile` option [#770].
- `katex` plugin: Catch Katex errors when delimiters are allowed
- Updated dependencies: `std`, `satori`, `vento`, `decap-cms`, `esbuild`, `ssx`, `lume-bar`, `deno-dom`, `unocss` and some icons.
- Fixed bug with date handling in the `sheets` plugin [#772].
- Don't urlencode the `basename` variable.

## [3.0.5] - 2025-07-17
### Changed
- Unify browsers support accross several plugins like `postcss`, `highlightningcss` or `esbuild`.
- Remove access request to env variables [#765]
- `favicon`: Changed the default favicon.ico file size from 48x48 to 32x32.

### Fixed
- `decap_cms`: prevent to apply a layout to the generated admin page.
- When the update action fails, the watcher is paused indefinitely.
- Updated dependencies: `svgo`, `terser`, `postcss`, `decap-cms`, `unocss`, `deno_dom`, `std`, `tailwindcsss`, `vento`, `sharp` and some icons.

## [3.0.4] - 2025-06-13
### Fixed
- Performance measurement error building an empty site.
- Updated some icons.

## [3.0.3] - 2025-06-12
### Added
- Google fonts plugin: new option `ignoredSubsets` [#755].
- Lightningcss plugin: Report errors in the terminal and Lume bar.
- Tailwindcss plugin: Add `minify` option [#757].
- Feed plugin: new option `stylesheet` to style xml outputs.
- More build info in the Lume bar, like performance and ability to enable/disable drafts.

### Fixed
- Sitemap plugin mangles already existing robots.txt file [#761]
- The Lume bar is less invasive and hidden by default.
- Updated dependencies: `std`, `terser`, `esbuild`, `tailwindcss`, `xml`, `sass`, `postcss`, `unocss`, `vento`, `satori`, `decap-cms`, `lume-bar` and some icons.
- Redirects plugin with Netlify: append new redirects to the existing file instead of override the content.

## [3.0.2] - 2025-05-23
### Added
- Source maps support for tailwindcss plugin.
- Decap CMS plugin: show the URL in the debugbar.

### Fixed
- prism plugin: Allow `prism` as theme name.
- Add/copy paths starting with `_` (`add("_assets", "assets")`)
- minify_html plugin: Disable js and css minification by default
  unless `.css` and `.js` extensions are added.
- Vento filters in components (ex: `{{ comp.button() |> toUpperCase }})
- Slugifier: ignore errors for malformed URLs.
- Duplicated pages created with `site.page()`.
- `HelperThis` type.
- Error loading empty JSON files.
- Tailwindcss: Resolve relative modules
- Updated dependencies: `sass`, `lightningcss`, `std`, `terser`,  `satori`, `decap-cms`, `ssx`, `tailwindcss`, `unocss`, `vento` and some icons.

## [3.0.1] - 2025-05-10
### Added
- Reintroduced `site.copy()` function removed in 3.0.0, because it's still useful in specific scenarios.
- More info in the debugbar from minify_html, esbuild, terser, postcss, lightningcss, google_fonts and svgo plugins.

### Fixed
- Warning message by the transform_images plugin.
- Don't ignore `/.well-known` folders.
- Updated dependencies: `tailwindcss`, `unocss`, `lume-bar` and some icons.

## [3.0.0] - 2025-05-07
### Added
- New `site.add()` with support URLs and NPM specifiers.
- New debugbar for development mode.
- New options `cssFile`, `jsFile` and `fontsFolder` to configure a default destination for automatic generated code.
  It's used by default by code_highlight, google_fonts, prism and unocss.
  It's also used by default by components.
- New folder-based components.
- Components: allow to define default data values in components.
- `await` filter for nunjucks.
- `page.text` and `page.bytes` getters and setters.
- `site.process(callback)` as an alias of `site.process("*", callback)`.
- `site.preprocess(callback)` as an alias of `site.preprocess("*", callback)`.
- `Server` class is now compatible with `deno serve` command.
- New data merging strategy named `data`, used by the multilanguage plugin.
- `slugify_urls` plugin: new `transliterate` option to define a different library per language.
- `katex`: `cssFile`, `placeholder` and `fontsFolder` option. The plugin downloads the CSS code.
- `icons` plugin: Added css.gg and radix-ui.com/icons [#736]
- `feed` plugin: Allow to pass an array of options or a function that return an array of options.
- `sitemap` plugin: New option `stylesheet`.
- Deno lint plugin.

### Changed
- `Temporal` API is enabled by default.
- Minimum Deno version supported is LTS (2.1.0)
- Refactor source.build function to give priority to load over copy statically.
- Always load files with extensions that need to be (pre)processed instead copy them.
- Lume's components are now async.
- `jsx` plugin uses SSX library instead of React.
- The `jsx` pages have the `.page` subextension (`.page.jsx`).
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
- The basename variable reflects always the final URL instead of the original file [#660].
- Page generators can define the basename instead of the full URL to modify only the last part of the URL.
- Moved the date extration from the file paths to the `extract_date` plugin.
- `google_fonts`: renamed `folder` option to `fontsFolder`.
- `og_images`: renamed `satori` option to `options`.
- `redirects` middleware: `strict` option is false by default.
- `multilanguage` plugin: Now it can handle generator pages with an array of languages.
- `source_map` plugin: The `sourceContent` option is `true` by default.
- Renamed `CRITICAL` log level to `FATAL`. And added `TRACE` level.
- Renamed `site.server()` to `site.getServer()` for consistency with `site.getWatcher()`.
- Use the `site.cache` instance instead of creating a different instance per plugin.
- Changes in the `Cache` class:
  - Renamed `get()` to `getBytes()` for consistency with `getText()`
  - New method `remove()`.
  - Changed the signature of `getText()` and `getBytes()`.
- `renderOrder` property is not applied to page layouts [#749].
- unocss plugin: Used presetWind3 as default.
- renamed the `isRedirect` property created by redirects plugin to `unlisted`.

### Removed
- `jsx_preact` plugin. Use `jsx` instead.
- `liquid` plugin. Use `nunjucks` instead.
- `site.copyRemainingFiles()` and `site.copy()`. Use `site.add()` instead.
- Automatic `<!doctype html>` to all HTML pages.
- `extensions` option of the plugins `modify_urls`, `check_urls`, `base_path`, `code_highlight`, `fff`, `inline`, `json_ld`, `katex`, `metas`, `multilanguage`, `og_images`, `prism`, `purgecss`, `relative_urls`, `postcss`, `lightningcss`, `sass`, `svgo`, `filter_pages`.
- `name` option of the plugins: `date`, `json_ld`, `metas`, `nav`, `paginate`, `picture`, `reading_info`, `search`, `transform_images`, `url`, `postcss`.
- `site.loadAssets()` function. Use `site.add()` instead.
- `on_demand` plugin and middleware. If you need some server-side logic, you can use router middleware.
- `inline` plugin: removed the `attribute` option.
- `cache` option in `transform_images`, `favicon` and `og_images`. Use `LUME_NOCACHE=true` env variable to disable cache.
- `variable` option of Lume components. It's always `comp`.
- `name` special variable of components to customize the name. It's always the filename.
- `slugify_urls` plugin no longer handle unicode characters by default. Use the `transliterate` option to configure it.
- Internal variable `page._data` because it's useless.
- `site.globalData` variable due it's no longer needed. Use `site.scopedData.get("/")` if you need it.

### Fixed
- The resolution of npm and jsr specifiers by esbuild plugin have been improved.
- Replaced some thrown errors with warnings in the console (`icons`, `inline`, `picture`) [#740].
- Merging of multilanguage variables.
- Parsing the escaped URLs in CSS files.
- Improved the output CSS and JS code of components.
- Components interoperability, specially between JSX vs text engines.
- Improved reload after renaming or removing a folder.
- Added live-reload to the 404 page.
- Log an error if prism and codeHighlight plugins are registered at the same time [#497].
- Updated all dependencies to the latest version.
- Plugin sheets: UTF-8 characters in .csv files.
- Search plugin: Sorting when some pages lack key fields [#748]
- json_ld plugin: alias to non-string value causes an error.
- transform_images: preserve the animation between gif and webp formats [#750].
- Set `LUME_LIVE_RELOAD` env variable in the CMS environment
- check_urls plugin: Handle correctly the spaces and other escaped characters.

[#497]: https://github.com/lumeland/lume/issues/497
[#660]: https://github.com/lumeland/lume/issues/660
[#736]: https://github.com/lumeland/lume/issues/736
[#740]: https://github.com/lumeland/lume/issues/740
[#748]: https://github.com/lumeland/lume/issues/748
[#749]: https://github.com/lumeland/lume/issues/749
[#750]: https://github.com/lumeland/lume/issues/750
[#755]: https://github.com/lumeland/lume/issues/755
[#757]: https://github.com/lumeland/lume/issues/757
[#761]: https://github.com/lumeland/lume/issues/761
[#765]: https://github.com/lumeland/lume/issues/765
[#770]: https://github.com/lumeland/lume/issues/770
[#772]: https://github.com/lumeland/lume/issues/772
[#779]: https://github.com/lumeland/lume/issues/779
[#782]: https://github.com/lumeland/lume/issues/782

[3.0.9]: https://github.com/lumeland/lume/compare/v3.0.8...HEAD
[3.0.8]: https://github.com/lumeland/lume/compare/v3.0.7...v3.0.8
[3.0.7]: https://github.com/lumeland/lume/compare/v3.0.6...v3.0.7
[3.0.6]: https://github.com/lumeland/lume/compare/v3.0.5...v3.0.6
[3.0.5]: https://github.com/lumeland/lume/compare/v3.0.4...v3.0.5
[3.0.4]: https://github.com/lumeland/lume/compare/v3.0.3...v3.0.4
[3.0.3]: https://github.com/lumeland/lume/compare/v3.0.2...v3.0.3
[3.0.2]: https://github.com/lumeland/lume/compare/v3.0.1...v3.0.2
[3.0.1]: https://github.com/lumeland/lume/compare/v3.0.0...v3.0.1
[3.0.0]: https://github.com/lumeland/lume/releases/tag/v3.0.0
