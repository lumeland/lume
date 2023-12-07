# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project try to adheres to [Semantic Versioning](https://semver.org/).
Go to the `v1` branch to see the changelog of Lume 1.

## 2.0.0 - Unreleased
### Added
- New plugin `unocss`, to replace WindiCSS.
- New plugin `transform_images`, to replace Imagick.
- New option `server.root` to `Site`.
- New `basename` variable to change the final name of files/directories
- New function `site.getOrCreatePage()`.
- Allow to copy files/directories inside ignored directories [#520]
- Added generics to `search` functions. For example: `search.pages<PageType>()`.
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
  - New option `remarkOptions` [#518].

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
  Use the env variable `LUME_LOG=DEBUG|INFO|WARNING|ERROR|CRITICAL`.
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
[#501]: https://github.com/lumeland/lume/issues/501
[#518]: https://github.com/lumeland/lume/issues/518
[#520]: https://github.com/lumeland/lume/issues/520
[#521]: https://github.com/lumeland/lume/issues/521
