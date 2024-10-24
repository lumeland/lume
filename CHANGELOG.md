# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project try to adheres to [Semantic Versioning](https://semver.org/).
Go to the `v1` branch to see the changelog of Lume 1.

## [Unreleased]
### Added
- New plugin: `check_urls` to detect broken links [#675].
- New plugin: `icons` to load automatically icons from popular icon catalogs.
- New plugin: `google_fonts` to download and self-host automatically fonts from Google Fonts.
- New plugin: `brotli` to compress files.

### Fixed
- Nav plugin: Breadcrumb with urls with CJK characters.
- Enable tests for `sri` and `reading_info` plugins [#677].
- Fix tests for `esbuild` plugin [#676].
- `code_highlight` plugin: configuration type must be Partial [#679].
- Updated dependencies: `sass`, `terser`, `liquid`, `tailwindcss`, `std`, `preact`, `mdx`, `xml`, `satori`, `react` types, `unocss`, `magic-string`.
- esbuild plugin: Add support for `entryNames` option [#678].

## [2.3.3] - 2024-10-07
### Added
- Basic auth middleware: Added `errorMessage` option.
- Added "none" merge strategy to reset a previously defined strategy.
- Esbuild plugin: added support for `outExtension` [#668].
- New environment variable `LUME_CMS` to check whether the site is built by the CMS.
- Support for `localStorage` and `sessionStorage` in watch mode.

### Fixed
- Multilanguage plugin: The 404 page must be ignored.
- Transform images plugin with animated images [#671]
- When using special value `git created` for `date` variable, it will fall back to `git modified` first, then filesystem last modified date [#667].
- Environment variables defined in `_cms.ts` are available in `_config.ts`.
- Updated dependencies: `linkedom`, `sass`, `satori`, `terser`, `liquidjs`, `tailwind`, `date-fns`, `std`, `esbuild`, `preact`, `lightningcss`, `postcss`, `remark-rehype`, `rehype-stringify`, `react` types, `unocss`.

## [2.3.2] - 2024-09-10
### Fixed
- Nav plugin: include `slug` in the `toJSON` export.

## [2.3.1] - 2024-09-09
### Added
- New option `watcher.include` to add extra external paths to the watcher.

### Fixed
- Nav plugin: revert `child.slug` property removal.
- Updated deps: `sass`, `std`, `pagefind`, `xml`, `postcss`, `decap-cms`, `terser`, `deno-dom`.
- Nav plugin: Search for pages with basename as `index`.
- Reload on edit `_config.ts` and `_cms.ts` files if they are out of the src directory.
- Code improvements [#662].

## [2.3.0] - 2024-08-30
### Added
- New function `site.parseBasename`, to register new custom parsers to extract data from basenames.
- Restart after changing the `_config.ts` or `_cms.ts` files.
- New plugin `sri`.
- Improved plugin docs with links to the online documentation.
- New functions `nav.nextPage()` and `nav.previousPage()` for `nav` plugin.
- New method `toJSON()` added to the result of `nav.menu()` for `nav` plugin.
  For example:
  ```js
  const menu = nav.menu();
  JSON.stringify(menu);
  ```
- New sort options `asc-locale` and `desc-locale`.

### Changed
- BREAKING CHANGES in the `nav` plugin:
  - The `child.slug` property was deleted. Use `child.data.basename`.
  - All nav elements has the `data` attribute.
  - To check if a nav item corresponds to a page:
    ```js
    // Lume 2.2
    if (item.data) {
      return `<a href="{{ item.data.url }}">{{ item.data.title }}</a>`
    } else {
      return `<strong>{{ item.slug }}</strong>`
    }

    // Lume 2.3
    if (item.data.url) {
      return `<a href="{{ item.data.url }}">{{ item.data.title }}</a>`
    } else {
      return `<strong>{{ item.data.basename }}</strong>`
    }
    ```
  - These changes improve the sorting of the elements in the nav tree.

### Removed
- `cms.ts` file.

### Fixed
- Escape the `%` character in the URI [#652].
- Updated deps: `std`, `liquidjs`, `preact`, `tailwindcss`, `xml`, `postcss`, `autoprefixer`, `unocss`, `terser`, `eta`, `lightningcss`, `markdown-it-attrs`, `decap-server`, `liquidjs`, `preact-render-to-string`, `esbuild`, `react` types, `sharp`.
- Remove empty directories in `dest` folder [#626].
- Watcher new files on Windows.
- Feed plugin: error when the updated/published value is a string [#638].
- Fixed esbuild reload [#647].
- Fixed serve showing stale pages [#649].
- Speed up logging to console with colors [#651]
- Nav plugin: did ignore default order option [#655].
- Reload theme files if they are local.

## [2.2.4] - 2024-07-18
### Added
- New middleware `redirect_as2` [#632].

### Fixed
- `page.sourcePath` wrongly returns the remote url instead of the path for remote files.
- Reload remote files [#633].
- Vento components must be sync.
- Updated dependencies: `std`, `terser`, `sass`, `xml`, `liquid`, `highlight.js`, `unocss`, `decap_cms`, `tailwindcss`, `vento`, `preact-render-to-string`.
- Use a pinned version of `npm:decap-server` package for stability.
- DecapCMS script: switch from `unpkg` to `jsDelivr` for performance.
- Add `Server.addr` for getting local address [#634].
- Bug calculating the filename of remote files.
- Replaced `unpkg` with `jsdelivr` for stability and response times.

## [2.2.3] - 2024-07-05
### Added
- New option `caseSensitiveUrls` to allow to export two urls with the same name but different cases [#625].
- Support for `npm` specifiers to postcss and lightningcss plugins [#621].
- Redirects middleware: added `strict` option to configure whether distinguish the trailing slash or not. For backward compatibility is `true` by default.

### Changed
- Nav plugin: Improved behavior for sites with pretty urls disabled.

### Fixed
- Nav plugin: the `order` option is not applied.
- Updated dependencies: `std`, `postcss`, `esbuild`, `katex`, `preact`, `xml`, `vento`, `satori`, `unocss`.
- Vento plugin for component doesn't support multiline code.
- Removed `jxl` in `transform_images` plugin because it's not supported by Sharp [#630].

## [2.2.2] - 2024-06-21
### Fixed
- `search.data()` doesn't return data for source files (like `search.data("index.md")`).
- esbuild plugin: Fixed `basename` support [#617].
- Apply `mergedKeys` configuration in layouts [#618].
- Extended Preact types with Lume's custom attributes [#619].
- Hot reload: Ensure sockets are open before send updates [#614], [#615].
- Updated dependencies: `tailwindcss`, `terser`, `sass`, `std`, `react-render-to-string`, `xml`, `esbuild`, `vento`, `unocss`, `liquidjs`, `unified`.

## [2.2.1] - 2024-06-04
### Added
- Allow to run a server with `deno serve -A _config.ts`.
- New `noCors` middleware to prevent CORS errors during development.

### Changed
- Use `lume_init` dependency to upgrade Lume

### Fixed
- Port detection in `lume cms` command.
- Show an error when trying to copy a file from outside the src folder [#610].
- Updated dependencies: `std`, `preact-render-to-string`, `vento`, `lightningcss`, `unocss`, `pug`, `cms`, `liquid`, `lightningcss`, `esbuild`, `react-types`, `deno_dom`, `sass`, `unocss`, `xml`, `unidecode` ,`react-render-to-string`.

## [2.2.0] - 2024-05-17
[Luísa Villalta](https://galicianliterature.com/villalta) edition.

### Added
- Feed plugin: Add image support [#599], [#598].
- New middleware `shutdown`.
- Esbuild plugin: support for `jsr:` specifiers.
- New `Lume.Loader` type.
- New `afterLoad` event, triggered just after all files are (re)loaded.
- Show the error if a file cannot be copied.
- New option `theme` to download the theme CSS file automatically for the `prism` and `code_highlight` plugins.
- Metas plugin: allow to add custom metas [#604], [#608].

### Changed
- BREAKING: Removed `lume/cms.ts` module. Use import maps instead.
- The minimum Deno version supported is `1.43`.
- For better predictability, the `_cache` folder is generated in the root folder, instead of `src` folder.
- Simplified Esbuild plugin.
- Import `std` packages from `jsr` because they are not longer updated on `land/x`.
- The default port when lume build the site (not serving) is `80` or `443`, depending whether the location protocol is http or https. Previously it was `3000`.

### Deprecated
- `liquid` plugin. It never worked well with `search.pages()` [#600].

### Removed
- PostCSS plugin: Don't use nesting plugin by default since CSS nesting feature works across the latest devices and browser versions.

### Fixed
- Updated dependencies: `unocss`, `liquid`, `postcss-nesting`, `terser`, `xml`, `react`, `std`, `sass`, `preact`, `esbuild`, `svgo`, `cms`, `sheetjs`.
- FFF plugin: fix `getGitDate` priority [#603].
- Esbuild plugin:
  - Resolve bare specifiers mapped to `npm:`.
  - Renamed imports to `.js` when bundle is `false` [#594].
- Redirect plugin: resolve urls when site location has a subfolder [#606].
- Bug merging options from CLI and _config file [#607].
- The option `--port` no longer depends on `--serve`.

## [2.1.4] - 2024-04-17
### Added
- Pagefind plugin: Updated the `ui` object with the new options introduced in v1.1.0.

### Deprecated
- `init.ts` file.

### Fixed
- `esbuild` timeout [#591].
- Updated dependencies: `unocss`, `pagefind`, `postcss-nesting`, `sass`, `terser`, `vento`, `std`, `preact`, `unocss`, `liquid`, `react` types, `sass`, `tailwind`, `magic-string`, `lume_cms`, `sharp`, `esbuild`.

## [2.1.3] - 2024-03-28
### Added
- PostCSS plugin: new option `name` with the default value `postcss` [#582].
- date plugin: new formats `HUMAN_SINCE` and `HUMAN_SINCE_STRICT` expose [`formatDistanceToNow`](https://date-fns.org/v3.6.0/docs/formatDistanceToNow) and [`formatDistanceToNowStrict`](https://date-fns.org/v3.6.0/docs/formatDistanceToNowStrict) in the [date-fns](https://date-fns.org/) package, so you can refer to the amount of time that has passed since the an article was last written/modified, rather than just the date it was written [#589].

### Changed
- Do not ignore the `/.well-known` folder by default [#585].

### Fixed
- Reload site on rename/delete file.
- Updated dependencies: `std`, `esbuild`, `lightningcss`, `unocss`, `date-fns`, `cms`, `eta`, `katex`, `liquid`, `markdown-it`, `postcss`, `postcss-import`, `autoprefixer`, `preact`, `sharp`, `tailwindcss`, `terser`, `vento`.

## [2.1.2] - 2024-03-14
### Added
- `transform_images` plugin: added the `.webp` extension to the default options.
- `vento` plugin: New option `plugins` to use Vento plugins.
- Added `vento` and `addVentoPlugin` hooks.

### Fixed
- UnoCSS plugin: the async process of adding `<style>` elements is not awaited [#578].
- Updated dependencies: `std`, `terser`, `cms`, `postcss`, `react` types, `unocss`, `vento`, `date-fns`, `sass`, `terser`.
- Replace Sharp with `svg2png` as the library to convert svg to png.
- Init script creates always the `_cms.ts` file.

## [2.1.1] - 2024-03-01
### Fixed
- Bug on init command generating the _cms.ts file [#575]
- Updated dependencies: `lightningcss`, `terser`, `cms`, `postcss`, `postcss-nesting`, `std`, `vento`, `react` types.

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
[#575]: https://github.com/lumeland/lume/issues/575
[#578]: https://github.com/lumeland/lume/issues/578
[#582]: https://github.com/lumeland/lume/issues/582
[#585]: https://github.com/lumeland/lume/issues/585
[#589]: https://github.com/lumeland/lume/issues/589
[#591]: https://github.com/lumeland/lume/issues/591
[#594]: https://github.com/lumeland/lume/issues/594
[#598]: https://github.com/lumeland/lume/issues/598
[#599]: https://github.com/lumeland/lume/issues/599
[#600]: https://github.com/lumeland/lume/issues/600
[#603]: https://github.com/lumeland/lume/issues/603
[#604]: https://github.com/lumeland/lume/issues/604
[#606]: https://github.com/lumeland/lume/issues/606
[#607]: https://github.com/lumeland/lume/issues/607
[#608]: https://github.com/lumeland/lume/issues/608
[#610]: https://github.com/lumeland/lume/issues/610
[#614]: https://github.com/lumeland/lume/issues/614
[#615]: https://github.com/lumeland/lume/issues/615
[#617]: https://github.com/lumeland/lume/issues/617
[#618]: https://github.com/lumeland/lume/issues/618
[#619]: https://github.com/lumeland/lume/issues/619
[#621]: https://github.com/lumeland/lume/issues/621
[#625]: https://github.com/lumeland/lume/issues/625
[#626]: https://github.com/lumeland/lume/issues/626
[#630]: https://github.com/lumeland/lume/issues/630
[#632]: https://github.com/lumeland/lume/issues/632
[#633]: https://github.com/lumeland/lume/issues/633
[#634]: https://github.com/lumeland/lume/issues/634
[#638]: https://github.com/lumeland/lume/issues/638
[#647]: https://github.com/lumeland/lume/issues/647
[#649]: https://github.com/lumeland/lume/issues/649
[#651]: https://github.com/lumeland/lume/issues/651
[#652]: https://github.com/lumeland/lume/issues/652
[#655]: https://github.com/lumeland/lume/issues/655
[#662]: https://github.com/lumeland/lume/issues/662
[#667]: https://github.com/lumeland/lume/issues/667
[#668]: https://github.com/lumeland/lume/issues/668
[#671]: https://github.com/lumeland/lume/issues/671
[#675]: https://github.com/lumeland/lume/issues/675
[#676]: https://github.com/lumeland/lume/issues/676
[#677]: https://github.com/lumeland/lume/issues/677
[#678]: https://github.com/lumeland/lume/issues/678
[#679]: https://github.com/lumeland/lume/issues/679
[#681]: https://github.com/lumeland/lume/issues/681

[Unreleased]: https://github.com/lumeland/lume/compare/v2.3.3...HEAD
[2.3.3]: https://github.com/lumeland/lume/compare/v2.3.2...v2.3.3
[2.3.2]: https://github.com/lumeland/lume/compare/v2.3.1...v2.3.2
[2.3.1]: https://github.com/lumeland/lume/compare/v2.3.0...v2.3.1
[2.3.0]: https://github.com/lumeland/lume/compare/v2.2.4...v2.3.0
[2.2.4]: https://github.com/lumeland/lume/compare/v2.2.3...v2.2.4
[2.2.3]: https://github.com/lumeland/lume/compare/v2.2.2...v2.2.3
[2.2.2]: https://github.com/lumeland/lume/compare/v2.2.1...v2.2.2
[2.2.1]: https://github.com/lumeland/lume/compare/v2.2.0...v2.2.1
[2.2.0]: https://github.com/lumeland/lume/compare/v2.1.4...v2.2.0
[2.1.4]: https://github.com/lumeland/lume/compare/v2.1.3...v2.1.4
[2.1.3]: https://github.com/lumeland/lume/compare/v2.1.2...v2.1.3
[2.1.2]: https://github.com/lumeland/lume/compare/v2.1.1...v2.1.2
[2.1.1]: https://github.com/lumeland/lume/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/lumeland/lume/compare/v2.0.3...v2.1.0
[2.0.3]: https://github.com/lumeland/lume/compare/v2.0.2...v2.0.3
[2.0.2]: https://github.com/lumeland/lume/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/lumeland/lume/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/lumeland/lume/releases/tag/v2.0.0
