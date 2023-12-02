# Migration from Lume v1 to Lume v2

## Updated deps:

- std
- deno_dom
- eta
- lightningcss
- liquidjs
- nunjucks types
- pagefind
- preact
- react types
- pug
- svgo
- esbuild
- svgo
- terser
- unocss
- vento
- xml
- postcss

## Added

- `includes` option to `module` and `mdx` plugins.
- `basename` variable to change the final name of files/directories

## Core

- Removed output extension detection in the filename: #430
- Removed `processAll` and `preprocessAll`.
  - Changed the signature of `process` and `preprocess` to behave like
    `processAll` and `preprocessAll`.
- Changed the signature of `Page.create()`. The second argument is the page
  data, instead of the page content.
- New function `site.getOrCreatePage()`.
- New option `server.root` to `Site`.
- Removed `Page.dest` property #290.
  - This also removed `Page.updateDest` function.
- Removed `Page.src.lastModified` and `Page.src.created` because they are
  already in `Page.src.entry`.
- Removed `Page.src.remote` because it's already in `Page.src.entry`.
- Removed `Page.src.slug` because it's already in `Page.data.basename`.
- Removed `--dev` mode #244, #201.
  - Use the env variable `LUME_DRAFTS=true` to output draft pages.
- Removed `--quiet` argument
  - Use the env variable `LUME_LOG=DEBUG|INFO|WARNING|ERROR|CRITICAL`.
- Renamed the interface method `Engine.renderSync` to `Engine.renderComponent`.
- Removed `site.includes()` function.
- Renamed `site.searcher` to `site.search`.
- Changed the `Format` interface.
- The `pageSubExtension` is used only to load pages, but not for layouts,
  components, etc.
- Removed `site.loadComponents()`. It's included in `site.loadPages()` options.
- Removed `site.engine()`. It's included in `site.loadPages()` options.
- Removed `site.cacheFile()`
- Removed `Entry.setContent()`
- Replace `fn-date` with `Temporal` polyfill to convert dates.
- Removed message to upgrade Lume.
- Pretty URLs option doesn't affect to the `/404.html` page by default.
- Removed `Error` class to print the errors. `Deno.inspect()` is used instead.
- Refactor of `Server` function to work with `Deno.serve()` API #501.
- Renamed `core/filesystem.ts` to `core/file.ts`.
- Revamp of types.
  - Removed `core.ts` and created `types.ts`.
  - New global namespace `Lume`.
  - Use the lib `dom` and `dom.iterable` types instead of `deno-dom`.
- Removed `lume/core/utils.ts` and moved all utilities to different files under
  `/lume/core/utils/` folder.

## `search` Plugin

- Removed `returnPageData` option. Pages always return the `data` object
  https://github.com/lumeland/lume/issues/251
- Removed `search.tags()` function. Use `search.values("tags")`.
- Removed `data` filter.
- Added generics to `search` functions. For example: `search.pages<PageType>()`.

## `toml` Plugin

- It's installed by default
- New option `pageSubExtension` with the default value `.page`.
- Changed `extensions` option type to `string[]`.

## `yaml` Plugin

- New option `pageSubExtension`.
- Changed `extensions` option type to `string[]`.

## `jsx` Plugin

- Removed `window.React` #332.
- New option `pageSubExtension`.
- Changed `extensions` option type to `string[]`.
- The `includes` folder is automatically ignored.

## `slugify_urls` Plugin

- Slugify static files by default. #447

## `netlify_cms` Plugin

- Renamed to `decap_cms`.
- Changed `netlifyIdentity` option to `identity: "netlify"`

## `windi_css` Plugin

- Replaced with `unocss` Plugin.

## `markdown` Plugin

- Disable indented code blocks by default #376
- New option `useDefaultPlugins` that it's `true` by default.
- Removed `keepDefaultPlugins`

## `postcss` Plugin

- New option `useDefaultPlugins` that it's `true` by default.
- Removed `keepDefaultPlugins`
- The `includes` folder is automatically ignored.

## `mdx` Plugin

- Updated to MDX v3.
- New option `useDefaultPlugins` that it's `true` by default.
- Removed `overrideDefaultPlugins`
- Removed `pragma` option.
- The `includes` folder is automatically ignored.

## `remark` Plugin

- New option `useDefaultPlugins` that it's `true` by default.
- Removed `overrideDefaultPlugins`

## `module` Plugin

- New option `pageSubExtension`.
- Changed `extensions` option type to `string[]`.
- Replaced `.tmpl` subextension with `.page`.
- The `includes` folder is automatically ignored.

## `eta` Plugin

- New option `pageSubExtension`.
- Changed `extensions` option type to `string[]`.
- The `includes` folder is automatically ignored.

## `json` Plugin

- New option `pageSubExtension`.
- Changed `extensions` option type to `string[]`.
- Replaced `.tmpl` subextension with `.page`.

## `jsx_preact` Plugin

- New option `pageSubExtension`.
- Changed `extensions` option type to `string[]`.
- The `includes` folder is automatically ignored.
- Added `precompile` option for faster jsx transform.

## `liquid` Plugin

- New option `pageSubExtension`.
- Changed `extensions` option type to `string[]`.
- The `includes` folder is automatically ignored.

## `nunjucks` Plugin

- Disabled by default
- New option `pageSubExtension`.
- Changed `extensions` option type to `string[]`.
- The `includes` folder is automatically ignored.

## `pug` Plugin

- New option `pageSubExtension`.
- Changed `extensions` option type to `string[]`.
- The `includes` folder is automatically ignored.

## `vento` Plugin

- Enabled by default
- New option `pageSubExtension`.
- Changed `extensions` option type to `string[]`.
- The `includes` folder is automatically ignored.

## `multilanguage` Plugin

- Apply the default language to all pages without defined language.
- Removed the ability to insert translations in the middle of the data object.
- The uniqueness of a page is defined by the combination of id + type.

## `sass` Plugin

- The `includes` folder is automatically ignored.

## `lightningcss` Plugin

- The `includes` folder is automatically ignored.

## `pagefind` Plugin

- New option `highlightParam`.

## `feed` Plugin

- Renamed the option `info.date` to `info.updated`;
- Renamed the option `item.date` to `item.updated`;
- New option `item.published`;

## `not_found` middleware

- Added default options.
