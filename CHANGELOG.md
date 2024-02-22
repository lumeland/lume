# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project try to adheres to [Semantic Versioning](https://semver.org/).
Go to the `v1` branch to see the changelog of Lume 1.

## [2.1.0] - 2024-02-22
### Added
- Support `x-default` for unmatched languages [#528] & [#532]
  - `multilanguage` plugin
  - `sitemap` plugin
- New plugin: `fff` [#529].
- New plugin: `redirects` [#534].
- New plugin: `og_images` [#534].
- New plugin: `robots` [#570].
- New command `lume cms`.
- `onDemand` plugin: support async extraData function  [#560],  [#561].
- Core: `lume:*` global events.
- Core: `lume.getWatcher()` function.

### Changed
- BREAKING: Removed deprecated `--unstable` flag to the default `lume` task.
  Use the [`unstable` configuration in `deno.json`](https://docs.deno.com/runtime/manual/tools/unstable_flags).
- BREAKING: Upgrade `date-fns` dependency to version 3 [#541].
  This affects to how to import locales in the _config file:
  ```js
  // Old
  import gl from "npm:date-fns/locale/gl";

  // New
  import { gl } from "npm:date-fns/locale/gl";
  ```
- Allow to get value from attribute in CSS query of `getDataValue()` function [#556], [#558].
  See `metas` plugin for a clear example.
- `favicon` plugin: [#562]
  - Default ico size changed to 48.
  - Add `sizes="any"` to the svg icon.
  - Place the svg icon at end.
- logging:
  - URL transformation direction is more visually distinct. [#563]
  - colors replaced to `gray` to support terminals that does not support `dim` colors. [#566]
- `deno task lume upgrade` removes the `deno.lock` file [#527].
- `transform_images` plugin: don't enlarge images by default [#530].

### Fixed
- Pages filtered with `filter_pages` plugin are exported to the sitemap.
- Ensure `site.options.server.middlewares` array is always defined.
- Updated dependencies: `std`, `date-fns`, `lightningcss`, `vento`, `terser`, `autoprefixer`, `esbuild`, `sass`, `unocss`, `deno-dom`,  `esbuild`, `postcss`, `postcss-import`, `preact`, `preact-render-to-string`, `mdx`, `terser`, `liquid`, `react` types.
- `site.hooks.addMarkdownItPlugin` accepts multiple options
- `cli` commands are loaded dynamically.
- Added missing `Lume.Data.nav` variable [#567].
- BREAKING: `slugify_urls` plugin only slugify `.html` files by default.
  The reason is to avoid unexpected behaviors like renaming the `_headers` file [#569].
  Use `extensions` option to add more file extensions.
- Bug in `multilanguage` plugin that add non-html pages in the list of alternates.

## [2.0.3] - 2024-01-12
### Added
- `metas` & `feed` plugins: Suppport for functions to configure the data fields.
- `mdx` plugin: New `mdx` filter [#550].

### Changed
- `md` filter from `remark` plugin is async.

### Fixed
- esbuild plugin: Fix support for subextensions added to JSX files.
  For example: `file.client.jsx`.
- Conflict between `jsx` and esbuild plugin with `jsx` [#547].
- Don't break if env variables are not granted [#551].
- Nested components doesn't work in Vento [#552]
- Updated deps: `std`, `unocss`, `svgo`, `sass`, `postcss`, `postcss-import`, `vento`, `tailwindcss`, `react` types, `remark`, `sharp`.

## [2.0.2] - 2024-01-01
### Added
- Add critical log on rare case where developer forget to export the Site instance in the `_config.ts`

### Changed
- `decap_cms` plugin: Add a script in the homepage to redirect to /admin/
  when an invite token or recovery token is detected from netlify identity.
- `getOptionsFromCli` is moved from `mod.ts` to `utils/cli_options.ts` [#535], [#540].

### Fixed
- `sitemap` plugin: Add the `xmlns` namespace for localized urls.
- Files with all caps extensions are ignored [#542].
- `multilanguage` plugin:
  - Fix error of two pages with the same id, type and lang.
  - Fix the error of a page with lang, but undefined id.
- Removed unused `imagick` dependency.
- Added `Lume.PaginateResult` type.
- Apply merge data strategies between multiple _data files/folders in the same folder.
- Date recovery from Git repositories [#544].
- Updated dependencies: `std`, `esbuild`, `liquid`, `postcssNesting`, `react-dom` types, `sharp`, `svgo`, `vento`, `tailwindcss`, `minify_html`, `unocss`, `sass`.

## [2.0.1] - 2023-12-10
### Added
- `mdx` plugin: New `rehypeOptions` option [#517]

### Fixed
- `lightningcss` plugin: use the correct includes folder [#523].
- `mdx` and `remark` plugins: improved types.
- Lume needs Deno >= 1.38.
- Type of `Lume.Data.results`.
- Improved log messages of empty and ondemand pages [#525].
- `picture` plugin using the wrong attribute name [#526].
- Updated deps: `markdown-it`, `preact`, `terser`, `esbuild`.

## [2.0.0] - 2023-12-08
### Added
- New plugin `unocss`, to replace `windi_css`.
- New plugin `transform_images`, to replace `imagick`.
- New option `server.root` to `Site`.
- New `basename` variable to change the final name of files/directories. [#494]
- New function `site.getOrCreatePage()`.
- Allow to copy files/directories inside ignored directories [#520]
- Added generics to `search` functions. For example: `search.pages<PageType>()`.
- New environment variable `LUME_NOCACHE` to disable the cache of the remote files.
- TOML plugin: New option `pageSubExtension` with the default value `.page`.
- YAML plugin: New option `pageSubExtension`.
- JSX plugin: New option `pageSubExtension`.
- JSON plugin: New option `pageSubExtension`.
- Eta plugin: New option `pageSubExtension`.
- Liquid plugin: New option `pageSubExtension`.
- Nunjucks plugin: New option `pageSubExtension`.
- Pug plugin: New option `pageSubExtension`.
- Vento plugin: New option `pageSubExtension`.
- Markdown plugin: New option `useDefaultPlugins` that it's `true` by default.
- Postcss plugin: new option `useDefaultPlugins` that it's `true` by default.
- Module plugin:
  - New option `pageSubExtension`.
  - New option `includes`
- MDX plugin:
  - New option `useDefaultPlugins` that it's `true` by default.
  - New option `recmaPlugins` [#521].
  - New option `includes`
- JSX Preact plugin
  - New option `pageSubExtension`.
  - New `precompile` option for faster jsx transform.
- Pagefind plugin: New option `highlightParam`.
- Not found middleware: Added default options.
- Remark plugin:
  - New option `useDefaultPlugins` that it's `true` by default.
  - New option `remarkOptions` [#517] [#518].

### Changed
- Revamp of types.
  - Removed `core.ts` and created `types.ts`.
  - New global namespace `Lume`.
  - Use the lib `dom` and `dom.iterable` types instead of `deno-dom`.
- Changed the signature of `process` and `preprocess` to behave like
    `processAll` and `preprocessAll`.
- Changed the signature of `Page.create()`. It has a single argument with an object with the page content.
- Renamed the interface method `Engine.renderSync` to `Engine.renderComponent`.
- Changed the `Format` interface.
- Pretty URLs option doesn't affect to the `/404.html` page by default.
- Replace `fn-date` with `Temporal` polyfill to convert dates.
- Refactor of `Server` class to work with `Deno.serve()` API [#501].
- Renamed `core/filesystem.ts` to `core/file.ts`.
- Picture plugin: Renamed the attribute `imagick` to `transform-images`.
- TOML plugin:
  - is installed by default
  - Changed `extensions` option type to `string[]`.
- Slugify URL: Slugify static files by default. [#447]
- JSX plugin:
  - Removed `window.React` [#332].
  - Changed `extensions` option type to `string[]`.
  - The `includes` folder is automatically ignored.
- NetlifyCMS plugin:
  - Renamed to `decap_cms`.
  - Changed `netlifyIdentity` option to `identity: "netlify"`
- Markdown plugin: Disable indented code blocks by default [#376]
- Postcss plugin: The `includes` folder is automatically ignored.
- MDX plugin:
  - Updated to MDX v3.
  - The `includes` folder is automatically ignored.
- Module plugin
  - Changed `extensions` option type to `string[]`.
  - Replaced `.tmpl` subextension with `.page`.
  - The `includes` folder is automatically ignored.
- Eta plugin
  - Changed `extensions` option type to `string[]`.
  - The `includes` folder is automatically ignored.
- JSON plugin
  - Changed `extensions` option type to `string[]`.
  - Replaced `.tmpl` subextension with `.page`.
- JSX Preact plugin
  - Changed `extensions` option type to `string[]`.
  - The `includes` folder is automatically ignored.
- Liquid plugin
  - Changed `extensions` option type to `string[]`.
  - The `includes` folder is automatically ignored.
- Nunjucks plugin
  - Disabled by default
  - Changed `extensions` option type to `string[]`.
  - The `includes` folder is automatically ignored.
- Pug plugin
  - Changed `extensions` option type to `string[]`.
  - The `includes` folder is automatically ignored.
- Vento plugin
  - Enabled by default
  - Changed `extensions` option type to `string[]`.
  - The `includes` folder is automatically ignored.
- Multilanguage plugin
  - Apply the default language to all pages with undefined language.
  - Removed the ability to insert translations in the middle of the data object.
  - The uniqueness of a page is defined by the combination of id + type.
- SASS plugin: The `includes` folder is automatically ignored.
- LightningCSS plugin: The `includes` folder is automatically ignored.
- Feed plugin
  - Renamed the option `info.date` to `info.published`;
  - Renamed the option `item.date` to `item.published`;
  - New option `item.updated`;

### Removed
- Removed plugin `windi_css`. Use `unocss` instead.
- Removed plugin `imagick`. Use `transform_images` instead.
- Removed output extension detection in the filename: [#430]
- Removed `processAll` and `preprocessAll`.
- Removed `Page.dest` property [#290].
- Removed `Page.updateDest` function.
- Removed `Page.src.lastModified` and `Page.src.created` because they are
  already in `Page.src.entry`.
- Removed `Page.src.remote` because it's already in `Page.src.entry`.
- Removed `Page.src.slug` because it's already in `Page.data.basename`.
- Removed `--dev` mode [#244], [#201].
  Use the env variable `LUME_DRAFTS=true` to output draft pages.
- Removed `--quiet` argument
  Use the env variable `LUME_LOGS=DEBUG|INFO|WARNING|ERROR|CRITICAL`.
- Removed `site.includes()` function.
- Renamed `site.searcher` to `site.search`.
- The `pageSubExtension` is used only to load pages, but not for layouts,
  components, etc.
- Removed `site.loadComponents()`. It's included in `site.loadPages()` options.
- Removed `site.engine()`. It's included in `site.loadPages()` options.
- Removed `site.cacheFile()`
- Removed `Entry.setContent()`
- Removed message to upgrade Lume.
- Removed `Error` class to print the errors. `Deno.inspect()` is used instead.
- Removed `lume/core/utils.ts` and moved all utilities to different files under
  `/lume/core/utils/` folder.
- Search plugin:
  - Removed `returnPageData` option. Pages always return the `data` object [#251]
  - Removed `search.tags()` function. Use `search.values("tags")`.
  - Removed `data` filter.
- YAML plugin: Changed `extensions` option type to `string[]`.
- Removed WindiCSS plugin.
- Markdown plugin: removed `keepDefaultPlugins`
- Postcss plugin: removed `keepDefaultPlugins`
- MDX plugin:
  - Removed `overrideDefaultPlugins`
  - Removed `pragma` option.
- Remark plugin: Removed `overrideDefaultPlugins` option

### Fixed
- Updated dependencies: `std`, `deno_dom`, `eta`, `lightningcss`, `liquidjs`, `nunjucks types`, `pagefind`, `preact`, `react types`, `pug`, `svgo`, `esbuild`, `svgo`, `terser`, `unocss`, `vento`, `xml`, `postcss`, `markdown-it-defllist`.

[#201]: https://github.com/lumeland/lume/issues/201
[#244]: https://github.com/lumeland/lume/issues/244
[#251]: https://github.com/lumeland/lume/issues/251
[#290]: https://github.com/lumeland/lume/issues/290
[#332]: https://github.com/lumeland/lume/issues/332
[#376]: https://github.com/lumeland/lume/issues/376
[#430]: https://github.com/lumeland/lume/issues/430
[#447]: https://github.com/lumeland/lume/issues/447
[#494]: https://github.com/lumeland/lume/issues/494
[#501]: https://github.com/lumeland/lume/issues/501
[#517]: https://github.com/lumeland/lume/issues/517
[#518]: https://github.com/lumeland/lume/issues/518
[#520]: https://github.com/lumeland/lume/issues/520
[#521]: https://github.com/lumeland/lume/issues/521
[#523]: https://github.com/lumeland/lume/issues/523
[#525]: https://github.com/lumeland/lume/issues/525
[#526]: https://github.com/lumeland/lume/issues/526
[#527]: https://github.com/lumeland/lume/issues/527
[#528]: https://github.com/lumeland/lume/issues/528
[#529]: https://github.com/lumeland/lume/issues/529
[#530]: https://github.com/lumeland/lume/issues/530
[#532]: https://github.com/lumeland/lume/issues/532
[#534]: https://github.com/lumeland/lume/issues/534
[#535]: https://github.com/lumeland/lume/issues/535
[#540]: https://github.com/lumeland/lume/issues/540
[#541]: https://github.com/lumeland/lume/issues/541
[#542]: https://github.com/lumeland/lume/issues/542
[#544]: https://github.com/lumeland/lume/issues/544
[#547]: https://github.com/lumeland/lume/issues/547
[#550]: https://github.com/lumeland/lume/issues/550
[#551]: https://github.com/lumeland/lume/issues/551
[#552]: https://github.com/lumeland/lume/issues/552
[#556]: https://github.com/lumeland/lume/issues/556
[#558]: https://github.com/lumeland/lume/issues/558
[#560]: https://github.com/lumeland/lume/issues/560
[#561]: https://github.com/lumeland/lume/issues/561
[#562]: https://github.com/lumeland/lume/issues/562
[#563]: https://github.com/lumeland/lume/issues/563
[#566]: https://github.com/lumeland/lume/issues/566
[#567]: https://github.com/lumeland/lume/issues/567
[#569]: https://github.com/lumeland/lume/issues/569
[#570]: https://github.com/lumeland/lume/issues/570

[2.1.0]: https://github.com/lumeland/lume/compare/v2.0.3...v2.1.0
[2.0.3]: https://github.com/lumeland/lume/compare/v2.0.2...v2.0.3
[2.0.2]: https://github.com/lumeland/lume/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/lumeland/lume/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/lumeland/lume/releases/tag/v2.0.0
