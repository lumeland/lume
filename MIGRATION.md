# Migration from Lume v1 to Lume v2

## Added

- `includes` option to `module` and `mdx` plugins.

## Core

- Removed output extension detection in the filename: #430
- Removed `Page.dest` property #290.
  - This also removed `Page.updateDest` function.
- Removed `Page.src.lastModified` and `Page.src.created` because they are
  already in `Page.src.entry`.
- Removed `Page.src.remote` because it's already in `Page.src.entry`.
- Removed `--dev` mode #244, #201.
  - Use the env variable `LUME_SHOW_DRAFTS=true` to output draft pages.
- Removed `--quiet` argument
  - Use the env variable
    `LUME_LOG_LEVEL=DEBUG|INFO|WARNING|ERROR|CRITICAL|NONE`.
- Renamed the interface method `Engine.renderSync` to `Engine.renderComponent`.
- Removed `site.includes()` function.
- Changed the `Format` interface.
- The `pageSubExtension` is used only to load pages, but not for layouts,
  components, etc.
- Removed `site.loadComponents()`. It's included in `site.loadPages()` options.
- Removed `site.engine()`. It's included in `site.loadPages()` options.
- Removed `site.cacheFile()`
- Removed `Entry.setContent()`

## `search` Plugin

- Removed `returnPageData` option. Pages always return the `data` object
  https://github.com/lumeland/lume/issues/251
- Removed `search.tags()` function. Use `search.values("tags")`.
- Removed `data` filter.

## `toml` Plugin

- It's installed by default
- New option `pageSubExtension`.
- Changed `extensions` option type to `string[]`.

## `jsx` Plugin

- Removed `window.React` #332.
- New option `pageSubExtension`.
- Changed `extensions` option type to `string[]`.

## `slugify_urls` Plugin

- Slugify static files by default. #447

## `netlify_cms` Plugin

- Renamed to `decap_cms`.

## `windi_css` Plugin

- Replaced with `unocss`.

## `markdown` Plugin

- Disable indented code blocks by default #376
- New option `useDefaultPlugins` that it's `true` by default.
- Removed `keepDefaultPlugins`

## `postcss` Plugin

- New option `useDefaultPlugins` that it's `true` by default.
- Removed `keepDefaultPlugins`

## `mdx` Plugin

- New option `useDefaultPlugins` that it's `true` by default.
- Removed `overrideDefaultPlugins`

## `remark` Plugin

- New option `useDefaultPlugins` that it's `true` by default.
- Removed `overrideDefaultPlugins`

## `module` Plugin

- New option `pageSubExtension`.
- Changed `extensions` option type to `string[]`.
- Replaced `.tmpl` subextension with `.page`.

## `eta` Plugin

- New option `pageSubExtension`.
- Changed `extensions` option type to `string[]`.

## `json` Plugin

- New option `pageSubExtension`.
- Changed `extensions` option type to `string[]`.
- Replaced `.tmpl` subextension with `.page`.

## `jsx_preact` Plugin

- New option `pageSubExtension`.
- Changed `extensions` option type to `string[]`.

## `liquid` Plugin

- New option `pageSubExtension`.
- Changed `extensions` option type to `string[]`.

## `nunjucks` Plugin

- New option `pageSubExtension`.
- Changed `extensions` option type to `string[]`.

## `pug` Plugin

- New option `pageSubExtension`.
- Changed `extensions` option type to `string[]`.

## `vento` Plugin

- New option `pageSubExtension`.
- Changed `extensions` option type to `string[]`.
