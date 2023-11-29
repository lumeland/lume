# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project try to adheres to [Semantic Versioning](https://semver.org/),
but not always is possible (due the use of unstable features from Deno).
Any BREAKING CHANGE between minor versions will be documented here in upper case.

## [1.19.5]
### Added
- `remark` plugin: Support for passing custom configuration through to `remark-rehype`

## [1.19.4] - 2023-11-29
### Fixed
- Tailwind: Fix types for `options`.
- Favicon: Better error if the source file is missing [#504].
- A bug in fixPluginOrder that duplicated plugins in the config file [#514].

## [1.19.3] - 2023-10-29
### Changed
- Moved the createSlugifier function to an individual module in `/core/slugifier.ts`.

### Fixed
- Wrong urls in `pagefind` with `base_path` plugin [#502].
- Performance issue in `reading_info` plugin.
- Updated deps: `tailwindcss`, `deno_dom`, `highlight.js`, `sass`, `react` types, `unified`.

## [1.19.2] - 2023-10-21
### Added
- The second argument of the `page.data.url()` function has the default URL value.
- Default options for `Server` class:
  - root: `Deno.cwd() + "/_site"`
  - port: `8000`

### Changed
- Removed schema.org meta tags in metas plugin, because they are are not valid.
  Probably it needs a new specific plugin.
- Updated the minimum Deno version supported to `1.37.2`.
- `redirects` and `www` middleware support `307`, `308` status code.

### Fixed
- Ignore error checking Lume version in offline environments [#496].
- `lightningcss` plugin: after refreshing changes the imports of all files are mixed.
- Ignore `deno.lock` file by the watcher.
- Updated dependencies: `std`, `deno_dom`, `katex`, `preact`, `sass`, `svg2png`, `terser`, `pagefind`, `esbuild`, `liquid`.

## [1.19.1] - 2023-09-29
### Added
- `modify_urls` plugin: The replace callback can return a `Promise<string>`.
- `modify_urls` plugin: Pass the HTML Element instance in the third argument of the replace callback.
- `modify_urls` plugin: Support for `poster` attribute of `<video>` elements.

### Changed
- `favicon` plugin: Follow the recommendations from https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs

### Fixed
- `pagefind` plugin:
  - Convert the content of js, css and json files to string.
  - Added some missing UI configurations
- `imagick` plugin: bug removing duplicated entries.
- `mdx` plugin: use `remark-gfm@3.0.1` while mdx-js is not upgraded.
- Updated dependencies: `std`, `deno-dom`, `esbuild`, `imagick`, `markdown-it`, `preact`, `postcss`.

## [1.19.0] - 2023-09-25
### Added
- New plugin: `favicon`.
- New plugin: `reading_info`.
- New function `site.mergeKey()` to configure the merging strategy for data keys from the _config.ts file.
- New function `site.page()` to add pages dynamically from `_config.ts`.
- New function `search.files()` to return the files to be exported [#468].
- New `vto` filter [#480].
- New argument for `site.component()` to define the directory scope.
- Plugin `picture`:
  - Support sizes attribute [#482].
  - New options `name` and `order`.
  - Don't create the `picture` element if there's only one `source`.
  - Sort the output formats from the most modern to the most compatible [#492].
  - Support to transform only the formats, but not sizes [#492].
- Plugin `sitemap`: Support for multilanguage sites.

### Changed
- Plugin `metas`: Removed redundant twitter meta tags [#487] [#488]
- Upgrade `pagefind` to `v1.0`.
  This caused some BREAKING CHANGES:
  - Removed the `binary` options. The binary is downloaded automatically by the NPM package and no `_bin` folder is created.
  - The option `indexing.bundleDirectory` was renamed to `outputPath` and moved to the options root.
  - Added new `customRecords` option, a new feature from Pagefind.

### Fixed
- `minify_html` works offline.
- Updated dependencies: `std`, `vento`, `terser`, `lightningcss`, `esbuild`, `sass`, `postcss`, `autoprefixer`, `remark`.
- Use the wasm version of `lightningcss` due many bugs with the [N-API version in Deno](https://github.com/denoland/deno/issues/20072).
- Urls with spaces [#481].
- `on_demand` plugin: Fixed _preload.ts generation.
- `picture` plugin:
  - Support object and array imagick data [#490].
  - Fixed the value of the image's `src` attribute [#492].
  - Fixed attribute values starting/ending with space. For example `imagick=" png w600 "`.
- `imagick` plugin: Removed duplicated transformations (that outputs the same file URL)

## [1.18.5] - 2023-09-01
### Added
- JSON loader to esbuild [#473].
- `includes` option to Vento plugin.

### Changed
- Make Vento components synchronous.
- Non-HTML pages will render the layout if it's assigned directly (in the front matter).

### Fixed
- Updated dependencies: `std`, `@types/react`, `esbuild`, `postcss`, `postcss-nesting`, `autoprefixer`, `vento`, `eta`, `lightningcss`, `liquidjs`, `preact`, `rehype`, `sass`, `minify_html`.
- Script runner now uses `/usr/bin/env bash` instead of `/bin/bash` to improve portability [#466].
- `nav` plugin with non-pretty-urls pages [#467].
- `picture` plugin: use encodeURI to handle filenames with spaces [#469], [#470].
- `lightningcss` plugin importing external urls.
- Plugin options documentation.

## [1.18.4] - 2023-08-02
### Added
- Generic to `Page` to set the data interface. For example: `Page<Post>`.
- Support for page queries in source path url (starting with `~/`) [#462].
  For example: `site.url("~/multilanguage.tmpl.js(lang=en)")`
  returns the page with `lang=en` among all pages generated by this file.

### Fixed
- Updated dependencies: `std`, `esbuild`, `eta`, `imagemagick`, `@types/react`, `sass`.
- Changed quick start demo after init for Windows Powershell's compability [#463].
- `sass` plugin: Resolve `index.scss` and `_index.scss` files.

## [1.18.3] - 2023-07-26
### Fixed
- `relative_urls` give wrong URL when `prettyUrls` is disabled [#451]
- `module` loader cache.

## [1.18.2] - 2023-07-21
### Added
- `slugify_urls` plugin is applied also to static files [#447].
- You can upgrade to Lume v2 (development version) with `lume upgrade --dev=v2`.
- Add `proxyCommand` as option for `netlify_cms` plugin [#449].

### Changed
- `on_demand` plugin: Changed the way to generate the `_preload.ts` file.
- Ignore `deno.lock` file by default [#450].

### Fixed
- Assets with sub-extensions (like `.min.css`) are not exported correctly [#448].
- Esbuild plugin fixes:
  - Send browser's User-Agent headers to esm.sh
    to ensure browser compatible code [#442].
  - Save the esm.sh requests in cache.
    This ensure the plugin will works offline, once the requests are cached.
  - Change the order of the custom plugins [#445]
- Updated deps: `terser`, `std`, `preact`, `postcss`, `liquid`, `esbuild`, `@types/react`, `@types/react-dom`, `terser`, `tailwind`.
- Changed default proxy command for `netlify_cms` [#449].

## [1.18.1] - 2023-07-05
### Fixed
- Updated deps: `std`, `esbuild`, `katex`, `lightningcss`, `postcss-nesting`, `terser`, `vento`.
- Ensure cached remote files are refreshed if something fails.
- Support for `data:` urls to esbuild [#442].
- Some TypeScript errors [#441].

## [1.18.0] - 2023-06-28
Announcement in the [Lume blog](https://lume.land/blog/posts/lume-1.18.0-release-notes/)

### Added
- TOML Plugin [#432].
- JSON Plugin supports `.jsonc` files [#433].
- Front matter support for JSON / TOML format [#434].
- Picture plugin [#384].
- Vento plugin.
- Support for symlinks in the src folder.

### Changed
- `lightningcss` plugin bundles the CSS code by default.
  Set the option `includes: false` to only transform the code.
- Improved type annotation of `Site.addEventListener`.

### Fixed
- Searcher returns the 404 page.
- Asset pages generated from a generator.
- postcss overrides the default includes path for CSS files.
- Nunjucks relative includes.
- Updated dependencies: `std`, `esbuild`, `eta`, `liquidjs`, `postcss-nesting`, `preact-render-to-string`, `sass`, `terser`.

## [1.17.5] - 2023-06-08
### Fixed
- `Site.copy` now works as expected when given a path with a trailing slash. [#426]
- YAML front matters containing only a comment no longer result in an error. [#431]
- `@import` to includes folders in SASS plugin.
- File watcher when a new directory is added.
- File watcher enter in an infinite loop in some cases.
- Updated dependencies: `std`, `lightningcss`, `liquidjs`, `postcss`, `preact`, `terser`.

## [1.17.4] - 2023-05-25
### Added
- The env variable `LUME_ENV=development` is created when `deno task lume --dev`.
- New `site.searcher` property with a instance of `Searcher` class.
  It's used by plugins like `search`, `nav`, `sitemap` and `feed`.
  (Previously, each plugin had it's own instance).
- Cache the remote files using Web Cache API.
- Support for `changefreq` and `priority` tags to `sitemap` plugin.

### Changed
- The minimum version of Deno supported is `1.33.4`.
- `lightningcss` plugin bundlers the CSS code by default
  (set `includes: false` option to only transform it).
- BREAKING CHANGE: Removed the sync template loader for nunjucks.
  Use `asyncEach / endeach` and `ifAsync / endif` instead of `for / endfor` and `if / endif`
  if you need to include templates between these tags.

### Removed
- The `site.includesLoader` class.

### Fixed
- Ignore `/.git` folder by the watcher.
- Don't show the full path of the files in the output.
- Don't remove unchanged files [#418].
- Updated dependencies: `std`, `preact`, `terser`, `remark-parse`, `esbuild`.

## [1.17.3] - 2023-05-10
### Fixed
- The `lume/` import is not correctly generated with `lume init`.
- File system update in watch mode.

## [1.17.2] - 2023-05-09
### Added
- Option for specifying the init directory [#417].

### Removed
- The `deno task lume init` command.
  Since Lume cannot be installed globally, it doesn't make sense any more.

### Fixed
- Dot files mustn't be ignored [#419].

## [1.17.1] - 2023-05-08
### Fixed
- Changes on static files deletes the file from `_site` [#418].

## [1.17.0] - 2023-05-05
Announcement in the [Lume blog](https://lume.land/blog/posts/lume-1.17.0-release-notes/)

### Added
- Feed Plugin [#413]
- Ability to add extra data to `on_demand` pages.
- Support for negative tags in `search` plugin. For example:
  `search.pages("tag1 !tag2")`.
- Support for remote files in `sass` plugin.
- Improved `lume init` for some plugins like `mdx` or `tailwindcss`.

### Changed
- Refactor of the internal file system manager, reducing complexity and fixing some bugs.
  The `Reader` class was replaced by `FS`.
- `deno task serve --quiet` no longer logs the http server requests.
- BREAKING: The `includes` option of `sass` plugin accepts only a string
  (previously `string[]` was also accepted).
- BREAKING: Removed all `Deno.run` calls and replaced with the new `Deno.Command` API.
  -  Removed the `ScriptOptions` argument of `lume.run()`.

### Removed
- `lume import-map` command.
- BREAKING: Removed `ci.ts` file. It's no longer needed due Lume is executed from Deno tasks.
- BREAKING: Removed `install.ts` file.

### Fixed
- `multilanguage` plugin:
  The generated `hreflang` links must have the absolute URL and include the current page.
- Moved the `nunjucks` dependency to `npm:` import [#409].
- Moved the `tailwindcss` dependency to `npm:` import.
- `metas` plugin:
  Remove multiple spaces, line breaks and HTML tags.
- `pagefind` plugin:
  Fix the output string to be a string decoded from raw byte data [#411].
- Duplicate pages on reload files inside `_data/` folders.
- Updated dependencies: `sass`, `deno_dom`, `nunjucks`, `std`, `esbuild`, `terser`, `katex`, `lightningcss`, `postcss`, `terser`, `liquid`, `tailwindcss`, `katex`, `imagick`, `preact-render-to-string`, `date-fns`.

## [1.16.2] - 2023-04-03
### Added
- Not operator for `search` plugin [#406].
  For example the negation of `level>2` is `level!>2`.
  - Support for the NOT operator at the beginning: For example `level!>2` and `!level>2` are equivalents.

### Fixed
- JavaScript source maps on Chrome/Safari [#407]
- Nunjucks cache for the imported templates.
- The `multilanguage` plugin doesn't prefix the custom URLs with the language code.
- Updated dependencies: `std`, `esbuild`.

## [1.16.1] - 2023-03-29
### Added
- `esm` option to `esbuild` plugin [#400], [#401].
- `query` and `sort` arguments to `nav.menu()` and `nav.breadcrumb()`.

### Fixed
- Return type in Preact engine [#403].
- `minify_html` plugin configure the site to load the `.html` files as assets.
- Updated dependencies: `std`, `terser`, `sass`, `esbuild`, `liquid`, `preact`.

## [1.16.0] - 2023-03-21
Announcement in the [Lume blog](https://lume.land/blog/posts/lume-1.16.0-release-notes/)

### Added
- New plugin `nav` to create menus using the URL hierarchical structure.
  It also can create breadcrumbs [#351], [#353].
- New middleware `serve_folder` to include additional folders to the server [#383].
- New function `site.copyRemainingFiles()`.
- New property `page.data.children` to store the rendered page content [#357], [#398].
- BREAKING: `multilanguage` plugin has changed significantly:
  - It requires to specify the available languages in the configuration. For example:
    ```js
    site.use(multilanguage({
      languages: ["en", "gl"],
    }))
    ```
  - The `page.data.alternates` object has changed the signature to `PageData[]`.
    Previously it was `Record<string, Page>`.
  - Different pages can be defined of translated versions of the same page with the new `id` variable.
  - `mergeLanguages` helper has been removed. Use the `id` value to relate pages.
- Added support for using prerelease versions of Pagefind [#388].
- `paginate` plugin: The second argument of `each` function contains the page number.
- Support `.markdown` file extension for Markdown [#386], [#387].
- Expose the `PluginOptions` interface [#390].
- Run the `inline` plugin on elements within a `<template>` element.
- Added `copyAttributes` option to the `inline` plugin to support custom attributes.
- Added `foreignKeys[n].filter` option to the `relations` plugin.
- Allow filename dates to be followed by either an underscore or hyphen [#395].

### Changed
- Removed global installation in benefit of Deno tasks.
  If you want to have the `lume` command, install [Lume CLI](https://github.com/lumeland/cli).

### Fixed
- `--open` flag: Include all platforms supported by Deno.
- Updated dependencies: `std`, `esbuild`, `liquid`, `preact`, `terser`, `eta`, `pagefind`, `sass`, `autoprefixer`.
- `reload` middleware doesn't keep the response header.

## [1.15.3] - 2023-02-20
### Added
- New hook `markdownIt` to modify the `MarkdownIt` instance directly.
- New option `lastmod` to the sitemap plugin [#369].
  It accepts a `string` with the key of the variable (by default is `date`),
  or a custom function to get the date from the page data.
- New option `ui.processTerm` to `pagefind` plugin.

### Changed
- Improved TUI for `init` script [#358], [#374].

### Fixed
- `inline` plugin: handle `width` and `height` attributes of inlined SVG files.
- Updated dependencies: `std`, `preact`, `sass`, `terser`, `esbuild`, `imagemagick`, `mdx`, `lighningcss`, `liquid`, `postcss-nesting`, `pagefind`.

## [1.15.2] - 2023-02-02
### Added
- Property `inheritData` for components [#364].
- Support for import maps in the deno.json file.

### Changed
- Improved the `multilanguage` plugin:
  - Languages versions stored in different files are better handled.
  - Removed the root key of the page language.

### Fixed
- Updated dependencies: `std`, `esbuild`, `eta`, `postcss-nesting`, `terser`, `pagefind`.

## [1.15.1] - 2023-01-14
### Added
- Support for `body` filters to Liquid.

### Fixed
- `--unstable` flag requirement for `lume init`.
- Error with `npm` specifiers in `lume init` [#359].
- Updated dependencies: `std`, `esbuild`, `eta`.

## [1.15.0] - 2023-01-10
Announcement in the [Lume blog](https://lume.land/blog/posts/lume-1.15.0-release-notes/)

### Added
- Archetypes, that allows to create templates used when creating new content [#337].
- New plugin `tailwindcss` [#344].
- Third argument to `site.data()` to customize the data path [#339].
- Improved the `relations` plugin:
  - You can configure the key used to save the relations with `relationKey`.
  - You can configure the key used to save the multiple relations with `pluralRelationKey`.
- New hook `postcss` to modify the `Processor` instance in a low level way.
- You can change the `type:og` in lume and default is website [#348].

### Changed
- `denosass` library has been replaced with [@lumeland/sass](https://www.npmjs.com/package/@lumeland/sass) NPM package
  (the same code as official NPM Sass package, but with a couple of tweaks to make it work on Deno).
- BREAKING: The plugin `relations` accepts an object instead of an array
  to configure the foreign keys:
  ```ts
  //Before:
  foreignKeys: {
    post: ["post_id", "id"]
  }
  // Before
  foreignKeys: {
    post: { foreignKey: "post_id", idKey: "id" },
  }
  ```
- BREAKING: The plugin `date` loads `date-fns` dependency from `npm:`.
  The locales must be loaded from npm. For example:
  ```ts
  import gl from "npm:date-fns/locale/gl/index.js";
  import pt from "npm:date-fns/locale/pt/index.js";

  //...
  site.use(date({
    locales: { gl, pt }
  }))
  ```

### Removed
- The `task.ts` file, used in the previous version of deno task.

### Fixed
- Updated dependencies: `pagefind`, `std`, `cliffy`, `esbuild`, `liquidjs`, `date-fns`, `lightningcss`, `postcss`.
- Source map with paths with spaces [#341].
- HTML charset on `reload` and `not_found` middlewares [#342].
- `lume run` wasn't receiving the argument name properly [#346].
- Reload the Deno cache after upgrading Lume [#340], [#343].
- `esbuild` loading for some specifiers defined in the import map.

## [1.14.2] - 2022-12-15
### Fixed
- `Deno.spawn` was removed in Deno 1.29 [#338].
- Updated dependencies: `std`, `esbuild`, `mdx`.

## [1.14.1] - 2022-12-13
### Fixed
- A bug in `site.processAll()` and `site.preprocessAll()` causes all pages are processed [#323].
- Updated `liquidjs` custom tags code.
- Updated dependencies: `cliffy`, `esbuild`, `katex`, `liquidjs`, `markdown-it-attrs`, `postcss`, `postcss-import`.

## [1.14.0] - 2022-12-12
Announcement in the [Lume blog](https://lume.land/blog/posts/lume-1.14.0-release/)

### Added
- Implemented `hooks` [#329].
  - `addMarkdownItPlugin(plugin, options)`
  - `addMarkdownItRule(name, rule)`
  - `addPostcssPlugin(plugin)`
  - `addEsbuildPlugin(plugin)`
  - `addNunjucksPlugin(name, fn)`
- New `components` option to MDX plugin.
- New plugin `filter_pages` [#254].
- Added `translations` option for `pagefind` plugin.
- New functions `site.processAll()` and `site.preprocessAll()` to (pre)process all pages at the same time [#327].
- A couple of improvements to `metas` plugin:
  - It's no longer needed to manually define the `mergedKeys` _data value.
    The plugin does it.
  - The `defaultPageData` option is deprecated [#321].
    Use data aliases instead, that also supports sub-keys. For example:

    ```yml
    title: This is the title
    intro:
      text: Page description
    metas:
      title: "=title" # Alias to the title value
      description: "=intro.text" # Alias to the intro.text value
    ```

### Changed
- The `<!DOCTYPE html>` declaration is added automatically to HTML pages if the Doctype is missing [#334].

### Removed
- `languages` option of `prism` plugin. Now you need to import the languages from `npm`.

### Fixed
- Updated dependencies: `pagefind`, `std`, `terser`, `postcss-import`, `lightningcss`, `liquid`.
- MDX renderer must return a JSX object instead of a string.
- Removed hardcode configuration of tags merging.
- URL of the pages processed by `esbuild` when `splitting` is enabled [#323].

## [1.13.2] - 2022-11-30
### Added
- Property `pages` to `afterRender` event, with all rendered pages.
- `splitting` support for the `esbuild` plugin [#323].
- Filters are available as a global variable in Pug [#320], [#328].

### Changed
- Relative urls from page generators [#324].

### Fixed
- Nunjucks cache in Windows.
- Updated dependencies: `std`, `esbuild`, `deno_dom`, `pagefind`, `lightningcss`, `markdown-it`, `postcss`, `preact`, `svgo`, `terser`.

## [1.13.1] - 2022-11-22
### Removed
- The `Page.isHtml` property added in v1.13.0.

### Fixed
- Updated the dependencies: `std`, `minify_html`, `sheetjs`.
- Updated `highlight.js` types.
- Updated `liquid` types.
- Updated `terser` types.
- Import `lightningcss` from npm.
- Load a fixed version of `prism` to avoid deno.lock errors.
- Live reload: use `wss://` protocol under `https://` [#316].
- Some Nunjucks template caches not cleaned after changes in watch mode.

## [1.13.0] - 2022-11-16
Announcement in the [Lume blog](https://lume.land/blog/posts/lume-1.13.0-release/)

### Added
- New `mdx` plugin.
- New `sitemap` plugin [#287].
- New method `Server.stop()` to close the local server [#296].
- New option `emptyDest` to configure whether the dest folder must be emptied before build [#308].
- The `src` property of pages and folders includes now the `slug` value [#278].
- New `Page.isHtml` property that returns whether the page is HTML.
- New `Page.outputPath` property that returns the output path of the page (formerly `page.dest.path + page.dest.ext).
- New option `returnPageData` to the `search` plugin [#251].
- New middleware `www` [#280].
- The plugin `relations` allows to customize the id key per type.
- The `multilanguage` plugin detects two different pages as language versions of the same page if the source file ends by `_[lang]` [#301].
  For example `/about-me.md` (default language), `/about-me_pt.md` and `/about-me_it.md`.
- New option `excludeSelectors` to `pagefind` plugin.

### Changed
- The file names starting with `[number]_` no longer are parsed as dates.
  For example `14455_full.jpg`. In previous versions, Lume interpret `14455` as a timestamp to create a Date and remove the prefix to output the file as `full.jpg` [#284].
- The plugin `search` ignores the page 404 [#299].
- For better compatibility, `postcss` and its plugins are loaded from `npm:` specifiers.
- The `Page.dest` and `Page.updateDest` properties are deprecated.
  If you want to change the destination of a page, simply update the `Page.data.url` value.
- JSX plugin now provides a jsx-runtime import to type `SX.IntrinsicElements`.

### Removed
- `react_runtime` and `preact_runtime` dependencies.
- `no-html-extension` option for `prettyUrl` configuration. To have the same functionality, disable the pretty urls and use the `modify_urls` plugin to remove the `.html` extension to the links.

### Fixed
- Removed typo in `jsx_preact`, allowing `comp` function to execute properly [#295].
- The data cascade merging was refactored and simplified.
- Types of Nunjucks.
- Updated dependencies: `std`, `esbuild`, `pagefind`, `liquid`, `preact`, `cliffy`, `nunjucks`, `lightningcss`.
- The requirement of the `--unstable` flag for `init`.

## [1.12.1] - 2022-10-15
### Added
- Show build duration and number of generated files [#283].
- New option `defaultPageData` to the `metas` plugin [#286].
- Support for CJK characters by the `slugify_url` plugin [#291], [#292].
- `beforeRender` event has the `pages` property with the list of pages that will be rendered.

### Changed
- Don't show `pagefind` output if everything is OK.
- `deno task lume` uses stdin evaluation. This allows to add more Deno flags to configure permissions, lock files, etc [#293].

### Fixed
- Export the `Options` interface for `katex` plugin.
- `git created` and `git last modified` date values use the creation or modification time as fallback when the page wasn't added to the git history.
- `relations` plugin has been refactored to better support rendering order and autogenerated pages [#285].
  - Removed the `onlyData` option (it's always true)
  - Sort multiple relations by id
- Date value in remote pages [#288].
- Updated dependencies: `std`, `esbuild`, `cliffy`, `preact`.

## [1.12.0] - 2022-10-03
### Added
- New plugin `katex` [#260].
- New plugin `pagefind` [#253].
- New plugin `sheets` [#252].
- New plugin `remark` to use this library as markdown renderer [#267].
- New plugin `source_maps` to generate the source maps of processed assets (CSS and JS) [#274].
- Allow to load remote configuration files.
  For example: `lume --config="https://example.com/_config.ts`.
- Improvements to the plugin `imagick`:
  - It accepts an array of formats [#268].
  - New `matches` property to apply transformations conditionally [#279].
- The `date` field of the pages accepts more formats [#272]:
  - Any IS0 8601 representation
  - `git created` to get the date of the file's first commit.
  - `git last modified` to get the date of the latest's first commit.

### Changed
- Minimum version of Deno is 1.25.4.
- In the build mode, in order to prevent some timers to keep the process alive indefinitely and after waiting 10 seconds, exit from the Deno process with a `Deno.exit(0)`.
- `site.pages`, `site.files` and `site.onDemandPages` are readonly properties.
  This allows to use their reference anywhere.
- Lume throws an exception if the `import_map.json` file doesn't contain the `lume/` import.
  (Previously it only showed a warning).
- When a processor returns `false`, the page is removed from the output.
- Moved some dependencies to `npm:` imports.
- Removed `cli/utils.ts` file and move all utils to `core/utils.ts`.

### Removed
- BREAKING: `parcel_css` plugin was removed (it was a temporary alias to the `lightningcss` plugin).
- The `--root` option in the CLI interface.
- Warning when different versions of Lume are being used.
- Removed the `lume vendor` command temporarily because it doesn't work in all cases.
  I'll consider reintroduce it again when the support for `npm:` modules is implemented.
- All `sourceMap` option of plugins like `esbuild`, `sass`, `postcss`, etc.
  Use the new `source_maps` plugin to configure the source maps generation in an unique place.

### Fixed
- New type `DeepPartial` to fix some plugins options with nested objects.
- Updated deps: `std`, `esbuild`, `lightningcss`, `sass`, `postcss_autoprefixer`, `minify_html`.
- When Lume edit the `import_map.json` file (after running `upgrade` or `import-map` commands), any specifier using a lume url is updated.
  Previously, only the `lume/` specifier was updated.
- `Procesor` return type.
- Repeated suffixes added to the images by the `Imagick` plugin [#269].
- Correct typo in invalid date error message [#271].
- `inline` plugin creates empty `class` and `id` attributes to SVGs [#276].

## [1.11.4] - 2022-09-18
### Fixed
- Markdown `rules` configuration [#259].

## [1.11.3] - 2022-09-16
### Added
- Missing option `preflight` to `windi_css` plugin (enabled by default).

### Changed
- Improved the live reload performance. Now the browser refresh faster and all changes are detected. In previous versions the browser didn't reload always if many pages were updated at the same time.

### Fixed
- Relative urls to images for the `metas` plugin [#255].
- Upgrade notification must be shown only on build.
- Upgrade command in the upgrade notification.
- Upgrade dependencies: `std`, `cliffy`, `postcss_autoprefixer`, `deno_dom`, `lightningcss`.

## [1.11.2] - 2022-09-12
### Added
- `lume init` configures JSX automatically on install `jsx` or `jsx_preact` plugins.

### Changed
- Pages are rendered in two separated steps: page rendering and layout rendering. This allows to modify the page data before render the layouts (for example adding a TOC).
- Renamed `parcel_css` plugin to `lightningcss`. For backward compatibility, `parcel_css` is kept as an alias of `lightningcss`, but will be removed in Lume 1.12.0.
- Some improvements in `esbuild` plugin:
  - The `esbuild_deno_loader` was removed because it wasn't updated and didn't work well.
    It has been replaced by a new loader, more simple and reliable.
  - Detect automatically the JSX configuration from the `deno.json` file.
    Now it works fine with jsx transformers.

### Fixed
- Updated deps: `esbuild`, `std`, `parcel_css`, `cliffy`, `postcss_autoprefixer`.
- The list of available plugins on `lume init`.

## [1.11.1] - 2022-09-02
### Fixed
- `jsx` and `jsx_preact` plugins when the children prop is a string.

## [1.11.0] - 2022-09-01
### Added
- New plugin `minify_html` [#248].
- New plugin `multilanguage`, to create pages of different languages [#205].
- New plugin `relations`, to create automatic relations between pages,
  similar to relational database (using id, type and foreign keys).
- New plugin `jsx_preact`, to use Preact instead of React.
- New plugin `windi_css`, to use Windi CSS framework [#247].
- Enabled the plugin `on_demand`, allowing to generate pages dynamically on Deno Deploy.
- New function `site.cacheFile()`.
- New function `site.component()` to register components directly [#250].
- New function `site.root()`, similar to `site.src()` and `site.dest()` but returns the path relative to the cwd.
- New property `site.onDemandPages` with an array of pages that must be generated on demand.
- New filter `data`, provided by the `search` plugin, to return the `Data` objects of the pages, instead the full `Page` instance.
- New `stopWords` option to the `slugify_urls` plugin [#243].
- New `each` option to the `paginate` plugin.
- New middleware `basic_auth` [#249].

### Changed
- The minimum Deno version supported is `1.24.0`.
- The paginate helper returns an array with the pages instead of a generator.
  This makes it more easy to work with, like inspect and modify the values [#241].
- `lume upgrade` upgrades lume locally by default (editing the import_map.json file).
  Run `lume upgrade --global` to update it globally (with `deno install`).

### Removed
- `/plugins.ts` module. It makes no sense.
- The ability to pass arguments to Deno after `--`. Example `lume -s -- --compact`.
  Use a deno task to customize how Lume is executed by Deno.

### Fixed
- Updated dependencies: `std`, `deno_dom`, `liquid`, `parcel_css`, `prism`, `autoprefixer`.
- Added the `content-type` headers of pages generated on demand.
- File paths added to `watcher.ignore` were not checked correctly.
- `inline` plugin does not respect additional style tag attributes [#246].

## [1.10.4] - 2022-08-14
### Added
- New variable `page.data.page` pointing to the page instance [#240].

### Changed
- Make `Renderer.preparePage()` public, so it can be used by some plugins.

### Fixed
- Improved `isPlainObject()` return type.
- Revert change introduced in `1.10.2` related with when pre-processors are applied to autogenerated pages [#239]

## [1.10.3] - 2022-08-12
### Fixed
- Improved `PaginateResult` type to support Index Signature `unknown` [#234].
- Improved `Paginator` type generic.
- Fixed `expired` middleware to remove the charset from the `Content-Type` header [#233].
- Updated `std` dependencies.

## [1.10.2] - 2022-08-11
### Added
- New option `rules` to markdown plugin [#218].
- A second argument to processors with the array of all pages. This allows to dynamically add or remove pages from a preprocessor.
- New function `Reader.saveCache()` to cache a file manually.
- Warning when empty files are skipped [#221], [#180]
- Added partial support for `deno.jsonc` files [#229].
- New interfaces `PageData` and `PageHelpers` for better user TypeScript experience [#228].
- New argument `--global` to `lume upgrade` to upgrade Lume globally (with `deno install` or locally (only updating the `import_map.json` file). For backward compatibility, this argument is `true` by default. To upgrade locally, run `lume upgrade --global=false`.
- `redirect` middleware can detect also full urls, not only pathnames.
- JSX plugin can render text files (like markdown). This allows to emulate mdx (combining jsx and md template engines for the same file).

### Changed
- Pre-processors assigned to page generators are executed **before** the new pages are generated (previously they were executed after generating them). This shouldn't be a BREAKING CHANGE, unless you're doing something very weird.
- Changed SASS library to [binyamin/deno-sass](https://gitlab.com/binyamin/deno-sass), that uses [dart-sass](https://github.com/sass/dart-sass) and improved source map support [#227].

### Fixed
- Updated dependencies: `std`, `liquid`, `deno_dom`, `esbuild`, `parcel_css`, `cliffy`, `postcss`.
- Improved `isPlainObject()` util function.
- Search improvements:
  - Numeric arguments passed to `search.pages()` are converted to numbers.
    For example `search.pages("foo=34")`, the `34` value is converted to number (previously it was a string)
  - Values with quotes are treated as strings. For example: `search.pages("foo='34'")`, the `34` value is a string.
- If a HTML document is missing `<!DOCTYPE html>`, it's automatically added to the document with `documentToString` [#223].

## [1.10.1] - 2022-07-15
### Added
- New event `beforeRender` triggered after loading the pages but before preprocess and render them.
- New `/init.ts` script to initialize Lume in a folder without install it, with `deno run -A https://deno.land/x/lume/init.ts`.
- New property `generator` to metas plugin [#215].

### Fixed
- Parcel Plugin should add a source-mapping comment [#207].
- Updated dependencies: `std`, `deno_dom`, `parcel_css`, `imagick`, `liquid`, `highlight.js`, `esbuild`.
- Ignore `deno.jsonc` file by default [#209].
- Ignored files starting with `.` or `_` in directories copied statically (with `site.copy()`).
- Copy static files starting with `.` or `_` if they are are explicit in the config file [#210].
- Suppress the update notice on `lume upgrade` [#206].
- Error when a JSX page returns a string [#214].

## [1.10.0] - 2022-06-16
### Added
- New `site.remoteFiles()` function to specify remote fallbacks for missing local files.
  The main goal is to build a theme system for Lume.
- New `lume vendor` command, to save all external modules in the `_vendor` folder.
- `_components` folder can be placed in any subdirectory.
  Like `_data`, this makes the components available only for these directories and subdirectories.
- New task `lume`, to run `deno task lume`. This deprecates the `build` and `serve` tasks (they will be removed probably at some point). The idea is all Lume commands to be executed from a single point (example `deno task lume --serve`) which makes it more portable without install anything.
- Pages with the `url` variable set to `false` are not exported.
- New event type `afterStartServer` dispatched after the local server starts (with `lume -s` or `lume --serve` arguments).

### Changed
- The tasks generated by Lume in `deno.json` no longer include the Lume url
  but get it from `import_map.json`. This prevents issues caused by having two different Lume versions
  and make more easy to change the Lume version, because only need to edit the `import_map.json` file.
- BREAKING: The asset pages (those loaded with `site.loadAssets()`) aren't rendered any more [#203].
- Use `std/encoding/front_matter` to extract the front matter values.

### Removed
- `components.directory` option. It's always `_components`.

### Fixed
- Internal refactors related with components and formats.
- Updated dependencies: `std`, `esbuild`, `imagemagick`, `parcel_css`, `terser`, `postcss_autoprefixer`, `react`.
- `lume upgrade` must update `deno.json` and `import_map.json` files even if the latest version is already installed.
- Used `std/media_types` in the `inline` plugin with support for much more content types.
- Pollution in the `page.data` property after rendering.
- Error in nunjucks using the `comp` block tag without arguments.
- Ensure `netlify_cms` local server starts only if the local serve starts.
- Don't copy static files when `afterRender` or `beforeSave` events return `false`.
- `merge` util override default values with `undefined` values.
- CSS reload error when the styles contain a `@import` to a different origin.
- Links to directory index files in the 404 default page.
- Wrap the `code_highlight` plugin execution in a try/catch, to avoid exit on error.

## [1.9.1] - 2022-05-26
### Added
- Improved the `esbuild` plugin:
  - Use [deno_loader](https://deno.land/x/esbuild_deno_loader) plugin by default.
  - Detect the import map file automatically (from `deno.json` file).
- `watcher.ignore` option accepts functions.
- New value `robots` for `metas` plugin [#202].

### Removed
- BREAKING: Removed `bundle` plugin because [`Deno.emit()` was removed in Deno](https://github.com/denoland/deno/pull/14463).

### Fixed
- Imagick plugin with custom urls [#197].
- Improved `site.src()` and `site.dest()` on Windows.
- Improved text truncation of `metas` plugin.
- Ignore `.DS_Store` files by default.
- Updated dependencies: `std`, `deno_dom`, `parcel_css`.

## [1.9.0] - 2022-05-16
### Added
- Ability to extract the Date from the directory path, not only filename [#198].
- `site.copy()` now accepts an array of file extensions to copy.
  For example: `site.copy([".jpg", ".png"])`.
- `site.copy()` accepts a function as second argument to fine tuning the output file name.
  For example: `site.copy("assets", (file) => "/dir" + file)`
  and also with extensions: `site.copy([".jpeg"], (file) => file.replace(".jpeg", ".jpg"))`
- Support for GitHub HTML server style [#193].
- The `prettyUrls` option allows `no-html-extension` value to use the same url resolution as GitHub [#193].

### Changed
- The `imagick` plugin has the `cache` option enabled by default.
- BREAKING: The asset pages (those loaded with `site.loadAssets()`) won't render the `layout` variable.
  This is something that you probably always wanted.
  For example after defining a default `layout` in a `_data.yml` file,
  this value was used also for assets like `.css` or `.jpg` files,
  and the only way to prevent this is creating another `_data.yml` file inside these files' directory with `layout: null`.
  With this change, this is no longer required, and `layout` is applied only for pages loaded with `site.loadPages()`.
- Simplify code: Merged `engines.ts` into `renderer.ts` class.

### Fixed
- Live reload with unicode characters in the path.
- Updated `std`, `postcss_autoprefixer` `parcel_css`, `cliffy`, `deno_dom` and `esbuild` dependencies.

## [1.8.0] - 2022-05-06
### Added
- New plugin `metas` to add automatically `<meta>` tags for SEO and social networks [#188].
- New plugin `prism` to use this library as code highligher [#187].
- New function `search.values()` to return an array of all unique values of a key [#191].
- New option `cache` to `imagick` plugin to cache the transformed images in the `_cache` folder [#184].
- Middewares have a third argument with the connection info.
- Support for nested components in Nunjucks using body helpers [#189].
- `site.ignore()` now supports functions [#53].
- `site.ignore()` affects to static files copied with `site.copy()`.
  This allows to copy a entire directory with `site.copy("statics")`
  but ignoring some subdirectories with `site.ignore("statics/ignored-folder")`.
- The `afterBuild` and `afterUpdate` events have the `staticFiles` property
  with info about the static files that have been copied.
- New property `site.files` containing all static files to be copied.
  It's like `site.pages` but for static files.

### Changed
- Use posix path style everywhere is possible on Windows.

### Fixed
- Inline plugin generates invalid javascript [#192].
- Updated `parcel_css`, `cliffy`, `react`, `markdown_it`, `liquid`, `std`, `esbuild`, `postcss`, `postcss_autoprefixer` and `pug`.
- Improved testing using Deno snapshots [#190].
- Live reload files with search or hash strings.
- Live reload files with cache busting path prefixes.
- Improved the `printError` function to print SASS errors properly [#194].
- Added an empty last line when generating `import_map.json` and `deno.json` files.
- Changed the `serve` task generation in `deno.json` to meet the changes introduced in Deno 1.21.2
  [denoland/deno/issues/14459](https://github.com/denoland/deno/issues/14459)
- Support relative path value in "lume" key in import map [#196].

## [1.7.4] - 2022-04-18
### Changed
- If the `date` variable of the pages is a `string` or `number`,
  it's converted to `Date` automatically [#181].

### Fixed
- _data files exporting an array with one element was incorrectly detected as a object.
- _data files in Windows were incorrectly merged.
- Updated `std`, `denosass`, `cliffy`, `imagick` and `esbuild`.
- `afterRender` event must stop the build if any listener returns `false`.
- After running a `lume upgrade`, the `deno.json` and `import_map.json` files are updated accordingly [#182].

## [1.7.3] - 2022-04-11
### Added
- New option `--version` to `lume upgrade`, to upgrade to a specific version.
- The `bundler` plugin detects automatically the import map file from `deno.json`.

### Changed
- Simplified `lume init` command:
  - Doesn't ask for the import style. Always use `import lume from "lume/mod.ts"`.
  - Doesn't ask whether create a import map file. It's created always.
- Simplified `import_map.json` file generation:
  Only `lume/` import is added. `lume` and `https://deno.land/x/lume/` are removed.

### Fixed
- Updated `std`, `esbuild`, `deno_dom`, `deno_graph`, `parcel-css`, `highlight.js`, `terser` and `react`.
- Improved Lume warnings.

## [1.7.2] - 2022-03-28
### Added
- The `date` plugin accepts an array of locales (ex: `["en", "gl", "pt", "es"]`),
  that are loaded automatically.

### Removed
- `lume/plugins/date/locale` import from the import_map.

### Fixed
- Throw an exception on missing configuration for Netlify CMS in the `netlify_cms` plugin.
- Fixed the `expires` middleware for `0` values.
- Live reload works offline.
- Updated `deno_graph` and `std`.

## [1.7.1] - 2022-03-20
### Fixed
- Task creation in the `deno.json` file.

## [1.7.0] - 2022-03-20
### Added
- New plugin `imagick`.
- New plugin `netlify_cms`.
- New `expires` middleware to add the `Expires` header to responses.
- New `cache_busting` middleware to include the assets version identifier in the path.
- New `redirects` middleware to configure custom redirects.
- New `mergedKeys` data key to configure how some keys will be merged.
- `lume/plugins/date/locale` bare import to the import_map.
- The `lume import-map` command creates a `deno.json` file (in addition to `import_map.json`)
  to automatically link the import map to Deno,
  meaning that you no longer need to specify the import map file in the command line
  (`lume -- --import-map=import_map.json`) because it's automatically detected.
- The `deno.json` file not only includes the `importMap` key with the "import_map.json"
  value but also a couple of tasks (build and serve) to run Lume using Deno tasks
  (`deno task build` and `deno task serve`).

### Changed
- Updated minimum Deno version supported to `1.20.1`.
- The `inline` plugin adds the `id` and `class` attributes
  from the removed `<img>` to the inlined `<svg>`.

### Removed
- The VS Code configuration in `lume init`. You can use a `deno.json` file with the `importMap` key.
- The `--file` option to `lume import-map`.

### Fixed
- Updated `std`, `esbuild`, `postcss`, `parcel_css` and `liquid`.
- `lume import-map` doesn't update the lume version.
- Improved `_data` reloading in watching mode.
- Refactor of components due Deno's bug with `console.log()`.
- `deno.json` file detection.

## [1.6.4] - 2022-03-02
### Fixed
- Updated urls from `https://lumeland.github.io` to `https://lume.land` [#175].
- Fixed url in the VS Code configuration generation [#175].
- Updated `std`, `postcss`, `liquid` and `parcel_css` to the latest version.

## [1.6.3] - 2022-03-01
### Changed
- The loader argument of `site.loadData()` is optional
  and use `textLoader` by default.

### Fixed
- Default targets to `parcel_css` plugin.

## [1.6.2] - 2022-02-23
### Fixed
- CSS live reload error with `<style>`.
- Updated `deno_graph`, `liquidjs` and `parcel_css`.
- The file watcher ignores the `.DS_Store` files (macOS).

## [1.6.1] - 2022-02-23
### Changed
- Added default targets to `parcel_css` plugin
  (the most recent version of every browser).

### Fixed
- CSS Live reload error checking cross-origin `@import`.

## [1.6.0] - 2022-02-21
### Added
- New plugin `sass`.
- New option `languages` to `codeHighlight` plugin [#169].

### Changed
- Use `std/http` modules to create the local server.
- The page data is passed to Markdown engine as an env variable.
  This allows to create markdown-it plugins that read/edit the page data,
  for example to get the content title and save it.
- Throw an error when two pages have the same url and ouputs to the same file (case insensitive) [#170].

### Fixed
- Pretty print the urls of the generated pages on build.
  Example: `/about/` instead of `/about/index.html`.
- Updated dependencies: `std`, `esbuild`, `deno_graph`, `markdown_it`, `liquidjs`, `parcel_css` and `postcss`.
- Prevent the mixture of the content for two pages that outputs to the same file [#170].
- Consistency of `page.data.url` after change any `page.dest` value.
- Bug detecting static files changes on update.
- Improved the live-reload script for images and stylesheets.

## [1.5.1] - 2022-02-01
### Added
- The `search` helper converts `undefined` and `null` values.
  Previously, only `true` and `false` values were converted.

### Fixed
- Revert a change in `1.5.0` that makes that some pages doesn't have the `url` value.

## [1.5.0] - 2022-01-31
### Added
- New plugin `esbuild`.
- New plugin `parcel_css`.
- New notification when an old version of Lume is detected.
- New architecture for the local server, with support for middlewares and events.
- Moved the watcher code to a new class `Watcher` in the core, with support for events.
- New command `lume import-map` to create/update import maps files [#164].

### Changed
- Upgrade the minimum Deno version supported to `1.18.1`.
- Moved some functions to `core/utils.ts`.
- Ignored the files `deno.json` and `import_map.json` by default.
- Renamed `Event` interface to `SiteEvent`.

### Removed
- Experimental watcher.
- `searchByExtension` function in `core/utils.ts` because it's not needed anymore.
- Argument `--only` for `lume init`.

### Fixed
- `page.document` must return `undefined` if the page is not a HTML page [#163].
- Updated `liquidjs`, `deno_graph` and `std`.

## [1.4.3] - 2022-01-12
### Fixed
- Updated `liquid`, `std`, `deno_dom` and `deno_graph`.
- Import maps with local files [#159], [#162].
- Ignored files in experimental watcher.
- Error on rename files.

## [1.4.2] - 2021-12-31
### Fixed
- Removed unstable Deno API functions on copy files.
- Remove always the date in the filenames of the pages,
  including pages that contain other date in the front matter.
- Prevent duplicated extensions configuration [#157], [#158].

## [1.4.1] - 2021-12-27
### Fixed
- Upgrade errors due unstable features.

## [1.4.0] - 2021-12-27
This version of Lume has a big internal code refactor but maintaining the public API,
so your sites should work without changes (unless you depend on internal undocumented features).
The only important change is the removal of `metrics` feature but probably you are not using it.

### Added
- **New Components feature**.
  It allows to create reusable components under the folder `_components`
  that you can use in your template engines.
  It's compatible with any engine (nunjucks, js/ts modules, jsx, liquid, pug, etc).
  - New function `site.loadComponents()` to set up more components loaders.
    For example: `site.loadComponents([".jsx"], moduleLoader, jsxEngine)`.
- Improved errors logs.
- Options for the `date` plugin to change the helpers' name [#150].
- The `pug` plugin registers the `pug` filter.
- Template engine filters (`njk`, `pug`, `liquid`...)
  can access to shared data (like `search`, `paginate` etc)
- You can add processors and pre-processors to run in all pages with `site.process("*", processFunction)`.
- You can use relative paths for `layout` values
  and when include templates using the template engine syntax (ex: `{% include "./template.njk" %}`).
- New function `site.includes()` to define different directories for specific extensions.
  For example: `site.includes([".css"], "_styles")`;
- The `extensions` option of some plugins allows to define different extensions
  for different purposes. For example:
  `{ pages: [".tmpl.js"], data: [".js"], components: [".comp.js"]}`.
- New search method `search.page()` to return the first page found instead an array with all pages.

### Changed
- Big internal code refactoring.
  - Many core classes have been split into different small classes
    with single responsibilities (SOLID principles).
  - In the version `1.x` there are many interface (like: `Site`)
    independent of the implementation (like: `LumeSite implements Site`).
    This was not easy to maintain and it makes hard to explore the Lume code in VSCode
    because everything is linked to the interfaces instead of the code.
    So I decided to remove these generic interfaces.
- The dates extracted from the filename (like `2022-12-05_pagename.md`)
  use UTC timezone for consistency with the dates defined in the front matter.

### Removed
- The `metrics` feature was removed. It was not very useful and I think maybe it can be implemented in better ways in the future.

### Fixed
- Updated `std`, `deno_dom`, `deno_graph`, `liquid`, `pug`, `liquid` and `postcss` to the latest version.
- Improved extensions detection: In `1.x` you have to load `.windi.css` before `.css` to prevent conflict. This was fixed in `2.x`.
- Lot of bugfixes in Windows, specially related with the different path formats.
- Socket error in Safari [#155].
- Added a bunch of new tests.
- Changes in the `.git` directory are no longer detected by the watcher.

## [1.3.1] - 2021-12-07
### Added
- The interface of `Renderer` exposes the `extraData` property.
- The `Engine` interface has a new method `renderSync`.
- Options for the `url` plugin to change the helpers' name [#149].

### Changed
- The option `sourceMap` of `postcss` plugin accepts the same options as `postcss` library [#147].
  Note: Previously, `sourceMap: true` created a `.map` file.
  Now it inlines the source map in the css file (because it's the default behavior of `postcss`).
  Set the value to `sourceMap: { inline: false }` to keep the old behavior.
- `jsx` elements have the `toString()` function to render to html automatically.
- Removed the deprecated `std/hash` dependency and use Web Crypto API.

### Fixed
- Updated `std`, `postcss`, `postcss-nesting`, `deno_dom` and `deno_graph`.

## [1.3.0] - 2021-11-15
### Added
- Initial (experimental) support for on demand server side rendering,
  used to generate pages dynamically, like [Jamstack's DPR](https://github.com/jamstack/jamstack.org/discussions/549).
  This is compatible with Deno Deploy, but with some limitations due Deno Deploy lack of support for some features (import maps or code generation from strings).
- New plugin `on_demand` to implement page rendering on demand.
- New event `beforeRenderOnDemand`.
- New option `watcher` to configure the watcher of the live reload
  (the debounce interval and a list of ignored paths).
- Improved default 404 page of the local server.
- Added more mime types to the local server.
- Improved the live reloading of the local server:
  - It works with multiple browsers simultaneously.
  - It reloads the current page after starting a server, to update with the latest changes.
  - It connects faster.
- The command `lume init` has the option `--only` to initialize only
  the config file (`lume init --only=config`)
  or VSCode (`lume init --only=vscode`).
- Now you can pass arguments to Deno from the Lume cli. For example, to add a custom import_map,
  passing arguments after `--`. For example: `lume --serve -- --import-map="import_map.json"`.
  Note: This supersedes flags feature that is no longer available (use env variables for that).
- New option `scopedUpdates` to define independent scopes and avoid to rebuild the entire site on update.
- New `options` argument to `addEventListener`:
  - `once` To remove the listener after the first execution.
  - `signal` To provide an `AbortSignal` to remove the listener at any time.

### Changed
- BREAKING: Upgraded the minimum version of Deno supported to `1.16.1`.
- BREAKING: Some internal parts have been refactored for more flexibility. This change affects to Lume types in `core.ts`.
  - New interface `Renderer` to render the site pages. This allows to create your own renderer to replace the default one.
  - New interface `Emitter` to emit the site pages and static files (save them in _site folder). This allows to create your own emitter to replace the default one.
- If a "before" event listener like `beforeBuild`, `beforeSave`, `beforeUpdate` returns `false`
  the build/update process is stopped.

### Removed
- `deno.land/std/io/util.ts` dependency because it's not needed anymore.
- BREAKING: Removed `flags` options. Use env variables to pass arbitrary data.
  For example, use `domain=example.com lume` instead of `lume -- example.com`.

### Fixed
- Updated `deno_dom`, `cliffy`, `deno_graph`, `liquid` and `svgo` dependencies.
- Catch a possible thrown error that stops the local server.
- Use `any` instead of `unknown` for the `Helper` type for more flexibility.

## [1.2.1] - 2021-10-28
### Fixed
- Upgraded `postcss-nesting`, `liquid`, `std`, `deno_graph` and `cliffy`
  to their latest version.
- Default `url` option for `paginate` helper.

## [1.2.0] - 2021-10-26
### Added
- New plugin `liquid` to use the [Liquid](https://liquidjs.com/) template engine.
- Options to `search` and `paginate` plugins. Now you can configure the helpers names.
- New module `lume/plugins.ts` that exports all available plugins.

### Changed
- Some internal restructuring to improve the code comprehension:
  - Moved the template engines inside the plugins that use them.
  - Split the `search` plugin to `paginate` and `search` plugins for coherence
    (both are enabled by default).
  - Moved the types of the dependencies to their deps/ files.
- `--quiet` is more quiet on `ci.ts` [#139].

### Fixed
- Updated `postcss`, `deno_graph` and `std`.
- Ignore the `dest` folder if it's inside `src` and doesn't start with `_` or `.`.
- Removed unnecessary file system checking.
- Default 404 page in local server.

## [1.1.1] - 2021-10-08
### Added
- A new experimental watcher (enabled with `lume --serve --experimental` or `lume --watch --experimental`).
  - It use Workers to build the site, in order to refresh the imported modules.
  - For now, import maps are not supported yet. [See the Deno issue](https://github.com/denoland/deno/issues/6675)

### Changed
- Uncoupled `cli/watch.ts` and `cli/server.ts` from `Site`.
  These modules no longer require a `Site` instance to work, only the necessary options.
- Reduced the debounce timing from 500ms to 100ms [#136]

### Fixed
- Upgrade `svgo`, `std`, `cliffy`, `postcss` and `terser`.
- File paths with UTF-8 characters are correctly handled.
- Inserted live-reload script in the default 404 html response.
- `base_path` plugin may not be executed if the `location` option is changed later.

## [1.1.0] - 2021-09-21
### Added
- Created a bunch of tests
- New plugin `resolve_urls` that transform links with source files to final urls.
  For example: `/posts/post-1.md -> /post/post-1/`.
  This allows to write markdown files that are navigable in GitHub.
- New plugin `modify_urls` that allows to edit the urls of HTML pages.
  It's used internally by other plugins like `relative_urls`, `base_path` or `resolve_urls`.
- `.jsx` pages can export a JSX element as default (previously only a function was accepted).
- The lume import map includes `https://deno.land/x/lume/` in addition to `lume/`.
  This allows to use the `_config.js` file with or without import maps.
- New option `keepDefaultPlugins` to `postcss` and `markdown`.
  Set to `true` append your plugins instead override the defaults.
- Minimal configuration options for `json` and `module` plugins.
- `lume init` can configure VS Code.
- The `server.page404` option works also with pretty urls (ex: `/404/`)

### Changed
- Removed all options of `lume init` and convert it to an interactive command.
- The data of different `_data` files and folders in the same directory is now merged.
  Previously it was overridden, causing inconsistencies.
- The local server returns a `301` response for folders without trailing slash.
  For example: `/about-us -> /about-us/`.

### Removed
- BREAKING: Markdown no longer modify the links automatically.
  Use `resolve_links` plugin.
- BREAKING: Removed the `entries` argument of `bundler` plugin.
  (sorry, it was a bad idea)

### Fixed
- Processors take into account the extension of the source file,
  in addition to the output extension to match with pre-processors behavior.
- Some types like arrays returned by `_data` files no more are converted to plain object.
- Some bugs in the `inline` plugin.
- Urls starting with `//` are not normalized because they are absolute urls
  For example: `//domain.com`
- Updated dependencies `std`, `deno_dom`.
- The property `data` of the pages is now enumerable.
  This makes pages compatible with some filters of Nunjucks.

## [1.0.5] - 2021-09-07
### Fixed
- Some bugs in the `bundler` plugin:
  - The `entries` array items don't need to start with `/`.
  - Show an error if some entry was not found.
  - Wrong content saved when `options.bundler` is `undefined`.

## [1.0.4] - 2021-09-06
### Changed
- Removed `includes` option for `bundler` plugin.
  They are detected and included automatically now!

## [1.0.3] - 2021-08-30
### Added
- Improved `bundler` plugin with the following additions:
  - New option `entries` to only emit some files.
  - New option `includes` to download and include external dependencies.
  - Support for `Deno.EmitOptions.bundle` to emit a single file with all dependencies.

### Fixed
- Updated `std`, `terser` and `svgo`.
- Updated `react` to include typings.
- Internal changes to how the processors and pre-processors are handled
  to ensure that they are executed in the same order they were registered.
- Use [Error cause](https://deno.com/blog/v1.13#error-cause) property to chain errors.

## [1.0.2] - 2021-08-20
### Added
- Property `_data` to save arbitrary values in the pages internally.
  Used by (pre)processors.
- Improved docs.

### Changed
- The minimum Deno version supported to `1.13.1` (from `1.12.2`).
- Switched to Deno’s native HTTP for the local server and live-reload socket.
  This improves the performance
  and removes the dependencies `std/http/server` and `std/ws`.

### Fixed
- Fixed some bugs in the `bundler` plugin:
  - Error processing files while watching due to wrong file extensions.
  - The processor now searches and replaces
    all `.ts`, `.tsx` and `.jsx` extensions with `.js`.
    This fixes the import errors.
- Updated `std`, `cliffy` and `deno_dom`.

## [1.0.1] - 2021-08-04
No changes.

## [1.0.0] - 2021-08-04
### Changed
- The minimum version of Deno supported is `1.12.2`.

### Removed
- BREAKING: Removed the import map aliases to `.js` files.
  Use the `.ts` extension to import Lume modules.
- BREAKING: `install.js`, `ci.js` and `cli.js` (with the `.js` extension)
  no longer exists.
  Use the `.ts` extension (`install.ts`, `ci.ts` and `cli.ts`).

### Fixed
- The `--plugins` option of `lume init`.
- Search pages using values with one character.
  For example: `search.pages("url!=/")`.
- Custom includes path resolution.
- Export plugins types for Deno doc.
- Updated `std`, `cliffy`, `postcss`, `highlight.js` and `markdown-it`.

## [0.25.5] - 2021-07-21
### Fixed
- Installation on Windows. [#131].

## [0.25.4] - 2021-07-21
### Changed
- Internal: make `Source.getOrCreateDirectory()` a private method.
- Ensure that new directories created dynamically during watching
  load `_data` files and folders.
  This opens the door to implement
  [DPR](https://github.com/jamstack/jamstack.org/discussions/549)
  in Lume.

### Fixed
- The `PluginOption` argument typing of the `lume()` function.
- The `yaml` loader should return an empty object instead of `undefined`
  on empty files.
- Relaxed the return type of helpers.
- Updated `std` and `cliffy`.

## [0.25.3] - 2021-07-12
### Changed
- Improved the metrics generation. [#125].
- Internal code improvements:
  - The abstract class `Engine` is converted to a TypeScript interface.
  - Created interfaces
    for `Site`, `Page`, `Directory`, `Source`, `Metrics`, etc.
  - Moved the core files to a `core/` directory.
  - Renamed `types.ts` to `core.ts`.

### Fixed
- Updated `highlight.js` and `eta`.

## [0.25.2] - 2021-07-09
### Added
- The plugin `date` accepts `now` as a value to format the current time.

### Changed
- Moved metrics save/print logic from the CLI to the `Metrics` class,
  so it’s decoupled from the CLI.

### Fixed
- The filename to save the metrics should be relative to `site.options.cwd`.
- Allow to save the metrics files in a subdirectory
  (and create it if doesn’t exist).
- The `--quiet` mode is now even quieter.

## [0.25.1] - 2021-07-07
### Added
- Detect the `_config.ts` file automatically if `_config.js` does not exist.
- Allow to set options to markdown-it plugins.

### Removed
- The `site.includes()` method since it’s not consistent with custom includes.

### Fixed
- The JavaScript deprecation message.
- The `lume init` command
  provided completions for the plugins enabled by default.
- Custom `includes` configuration for plugins is not correctly resolved
  if the `root` is different to `Deno.cwd()`.
- The plugin `bundler` on Windows.
- The plugin `postcss` with multiple includes.

## [0.25.0] - 2021-07-04
### Added
- Optionally, you can do `import lume from "lume";` in your config file
  (instead of `import lume from "lume/mod.ts";`).
- The `options` configuration key to the `eta` plugin to configure Eta.

### Changed
- Lume has been ported to TypeScript.
  This means that all files have the `.ts` extension.
  You should edit your config file to import `.ts` files instead of `.js`.
- Renamed plugin `svg` to `svgo`.

### Fixed
- Sync Nunjucks tags doesn’t return safe strings.
- Updated `std`, `terser` and `markdown-it`.

## [0.24.0] - 2021-06-28
### Added
- New `-w`/`--watch` option to watch changes without starting a web server.
  [#109].
- Made the `_includes` directory configurable: [#115].
  - new `includes` option for site and the `eta`, `nunjucks` and `pug` plugins
  - new `site.includes()` method, similar to `site.src()`.
- `options` configuration value to the `pug` plugin
  to set options to the `pug` compiler.
- Command `lume completions` to generate shell completions for Lume.

### Changed
- Render pages in parallel, reducing the build time for large sites.
- Added a `--no-check` option to `lume upgrade`, `install.js` and `ci.js`
  to reduce the execution time.
- Ported the CLI to TypeScript
  and made use of the external library Cliffy for better code structure.
  This brings the following changes: [#120].
  - Removed the duplicated `build` command. Use `lume` instead of `lume build`.
  - To see the Lume version, use `lume -V` or `lume --version`
    instead of `lume -v` (in lowercase).
- Replaced the `--verbose` option with `--quiet`.
- Errors always include the stack. [#116], [#117].
- Removed the `import_map.json` file because it’s not used.
  It was kept only for backward compatibility of `lume upgrade`
  from old versions.
- Some internal code has been ported to TypeScript:
  - the CLI
  - the dependency files
  - the template engines.

### Removed
- The `--verbose` option. Use `--quiet` for the same behavior as `--verbose=1`.

### Fixed
- The async cache for the `inline` plugin.
- Some pre-processors were executed several times. [#110].
- The `slugify_urls` plugin produced empty path segments
  (for example, `x/@/y` now becomes `x/-/y` and not `x//y` as before).
- JavaScript source maps. [#114].

## [0.23.3] - 2021-06-21
### Added
- New metrics feature that allows measuring the performance of large sites:
  Use `lume --metrics` to show the metrics in the CLI
  or `lume --metrics=filename.json` to save the data in a file.
  You can also configure it in the config file.
- New `--verbose` option to configure the level of details logged:
  - `0`: only important things
  - `1`: normal details (the default option)
  - `2`: high details (for debugging purposes)
- Allow extensions on Nunjucks. [#108].

### Fixed
- Improved the way CLI arguments are applied to the site instance.
- Ensure duplicated pages have an unique `src.path` value.
- The `relative_urls` plugin should ignore data URLs. [#107].

## [0.23.2] - 2021-06-19
### Fixed
- Relative URL resolution. [#105].

## [0.23.1] - 2021-06-17
### Fixed
- Error when using `search.pages()` without arguments.

## [0.23.0] - 2021-06-17
### Added
- New `slugify_urls` plugin.
- Support for quotes to `page.search()`.
  This allows to insert spaces in the values.
  For example: `page.search("'tag with spaces' title='Title with spaces'")`.

### Changed
- BREAKING: The URLs of the pages will no longer be slugified by default.
  Use the `slugify_urls` plugin.
- The plugin `attributes` is disabled by default.

### Removed
- The `slugifyUrls` option. Use the `slugify_urls` plugin for that.
- Support for objects in the `url` variable.

### Fixed
- Replaced the `terser` dependency with a Deno version.
- Updated `std` and `postcss`.

## [0.22.6] - 2021-06-15
### Added
- Events `afterRender` and `beforeSave`.
- New method `site.addHelper()` to register different types of helpers.

### Changed
- The class signature of template engines:
  replaced the `addFilter()` method with more generic `addHelper()`
  that allows to register not only filters but also custom tags
  and other features supported by some engines, like Nunjucks.

### Removed
- The experimental plugin `image`. Moved to another repository.

### Fixed
- Bug in the function to merge default and user options.
- Ensure the `Page` and `Directory` classes always have the `src` object.
- Updated `postcss` and `eta`.

## [0.22.5] - 2021-06-10
### Added
- Argument `limit` to `search.pages()`.

### Fixed
- Bug on overriding the URL with `--location`.

## [0.22.4] - 2021-06-09
### Added
- Display a warning when installing Lume with an old Deno version.

### Fixed
- Updated `std`.
- Updated `postcss` to support Deno 1.11.0.

## [0.22.3] - 2021-06-07
### Fixed
- Bug in the import map after upgrading to 0.22.2.

## [0.22.2] - 2021-06-07
### Added
- `deno run <script>` accepts several scripts at the same time.
- Display the name of a script executed by `deno run <script>`.

### Changed
- The CLI options are applied before `lume()` returns the site instance.
  This allows to access these options in `_config.js`.
  For example, after running `lume --dev`,
  you can include conditions in the `_config.js` file like this:

  ```js
  const site = lume();

  if (site.options.dev) {
    // Development stuff
  }
  ```

  Previously,
  these overrides were applied after `_config.js` exports the site instance.

### Fixed
- Improved the performance of loading page layouts by using the `Source` cache.
- Improved error reporting.
- `search.pages()` with no arguments
  returns pages with other extensions than `.html`.
- Clear the cache before building.
  This allows to run several builds in the same script.
- Updated `nunjucks` (a new fork) and `highlight.js`.

## [0.22.1] - 2021-06-05
### Fixed
- The file `ci.js` and the command `lume init` on Windows.

## [0.22.0] - 2021-06-04
### Added
- New plugin `base_path` to automatically search and fix all URLs in the HTML
  by adding the path prefix of the `location` option.
  This reduces the need to use the `url` filter everywhere.
- The `search.pages()` helper allows multiple values to sort by.

### Changed
- BREAKING: The `url` variable of the pages must start with `/`, `./` or `../`.
- Decoupled the loaders. Now they only need the path argument.
- Preprocessors check the extension of the input and output file.
  (Previously, only the output extension was used.)

### Fixed
- The `url` filter shouldn’t add the path prefix if it’s already added.
- `search.pages()` must return only HTML pages.
  (Previously, it also returned assets.)
- Windows installation. [#98].

## [0.21.1] - 2021-06-03
### Fixed
- Restored `import_map.json` to not break upgrades from older versions.

## [0.21.0] - 2021-06-01
### Added
- The `postcss` and `terser` filters. [#97].
- The `--plugins` argument to `lume init`, so you can load and use plugins.
  Example: `lume init --plugins=postcss,terser,pug`.
- The property `document` to `Page` that returns the parsed HTML.
- New plugin `code_highlight` to automatically highlight all code
  inside `pre code`. Previously, it was part of the Markdown plugin.
  Now it’s decoupled, so it can be used by any template engine.
- The `extensions` and `attribute` options to the `inline` plugin.
- New argument `--dev` (or `-d`) for `lume upgrade`
  to upgrade to the latest development version.

### Changed
- Nunjucks no longer loads `.html` files by default.
- The loader argument in `loadPages` and `loadAssets` is now optional,
  and the text loader is used by default.
- The loaders and template engines are now fully decoupled.
  This allows to use the variable `templateEngine` in a layout.
- BREAKING: Removed automatic code highlighting from the Markdown plugin.
  Use the new `code_highlight` plugin.
- Moved the client code of live reload to a external file `ws.js`.
- Live server reloads the entire HTML page after JavaScript changes.

### Removed
- The `.markdown` extension.
  Use `.md` or configure the Markdown plugin to enable it.
- The method `site.engine()`. Use the third argument of `site.loadPages()`.
  For example: `site.loadPages([".html"], textLoader, nunjucksEngine)`.
- The plugin `dom`.
  It’s no longer needed because pages can easily return the parsed HTML.
  For example: `site.process([".html"], (page) => modify(page.document))`.

### Fixed
- Updated `std`, `postcss`, `deno_dom`, `date_fns`
  and `highlight.js` (to `11.x`).

## [0.20.2] - 2021-05-18
### Added
- More default character replacements to slugifier.

### Changed
- Simplified the script runner
  by using the `/bin/bash` or `PowerShell.exe` executable.
  This adds support for more features, like pipes, etc.

### Fixed
- Updated `pug`.
- Resolve the imported files from template engines, like `nunjucks`,
  when the `src` is in a subdirectory.

## [0.20.1] - 2021-05-15
### Added
- File `install.js` for easy installation.

### Removed
- The command `install` from the CLI.

### Fixed
- The Lume version.

## [0.20.0] - 2021-05-14
### Added
- New properties `pretty` and `slugify` for the `url` page variable
  to override the corresponding `prettyUrls` and `slugifyUrls` site options
  in particular pages. [#95].
- `import_map.json` to the installation process. This allows to import Lume
  in the `_config.js` file with `import lume from "lume/mod.js";`.
- New command `lume install` to install Lume easily using the import map.
- New script `ci.js` to execute the CLI in a CI environment
  (without installing it or defining the import map).
- New argument `--import-map` for the `lume init` command
  to enable or disable the import map in the `_config.js` file.
  By default, it’s enabled.

### Changed
- The minimum Deno version supported to `1.10.0`.
- BREAKING: `prettyUrls` to not apply to the `url` page variable
  if it’s a string. To generate a custom pretty URL: [#95].
  - use an object (e.g., `{ path: /about-me }`)
  - add a trailing slash (e.g., `/about-me/`)
  - use a full URL (e.g., `/about-me/index.html`).
- BREAKING: `url` values to not assume that the page is HTML.
  This means the `.html` extension won’t be added by default. [#95].
- `lume init` to generate a `_config.js` file using the import map.
  Use `lume init --import-map=false` to use the old URLs.

### Removed
- The property `ext` from the `url` page variable,
  because `path` now includes it. [#95].
- The command `lume update`. It’s not needed thanks to import maps.

### Fixed
- Updated the `std` dependency.

## [0.19.0] - 2021-05-10
### Added
- The `url` page variable supports an object with `path` and `ext` properties
  to fully customize the output filename. [#83].
- New plugin `relative_urls` to convert all URLs to relative. [#85].
- Preprocessors (like processors, but are executed before rendering). [#91].
- Allowed setting options for the Nunjucks plugin. [#90].
- Options to customize the `slugifyUrls` setting: [#94].
  - `lowercase`: to enable/disable lowercase conversion (`true` by default)
  - `alphanumeric`: to convert all characters to ASCII (`true` by default)
  - `separator`: to customize the separator (`-` by default)
  - `replace`: an object to replace some special characters.
- Option `includes` to customize the path (or paths)
  used to resolve the `@import`ed files in the `postcss` plugin.
  Use `includes: false` to disable it.
- `autoprefixer` is included by default in the `postcss` plugin.

### Changed
- The default URL of the `paginate` helper to relative: `./page-${page}`.
- Improved the slugifier to handle the separator better, for example:
  - `200,000*7` becomes `200-000-7` and not `2000007`
  - `!2 / 3%` becomes `2/3` and not `-2-/-3-`
  - `Who is?.txt` becomes `who-is.txt` and not `who-is-.txt`.

### Removed
- The deprecated `permalink` variable in pages. Use `url` instead.

### Fixed
- Ignored files on server update weren’t detected properly. [#88].
- Throw an error when a proper template engine can’t be found. [#87].
- Missing doctype after DOM manipulation.
- The `njk` filter didn’t work with async filters. [#93].
- Fixed support for subextensions (like `page.html.md`). [#83].
- Improved the errors of the `inline` plugin.
- Made sure that all characters are lowercased when slugifying
  (so “№” becomes `no` and not `No`).
- Relative URL syntax to require the prefix `./` or `../`,
  so URLs like `.foo`, `..foo` or `.../foo` are interpreted correctly.
- Changes in `_data/*/*` files weren’t updated correctly on `--serve`.
- Updated the `postcss` and `postcss_import` dependencies.

## [0.18.1] - 2021-04-26
### Fixed
- Creation of `Date` values. [#82].
- Updated the `postcss` and `terser` dependencies. [#81].

## [0.18.0] - 2021-04-24
### Added
- A second argument for the `lume()` function
  to configure the default plugins. [#45].
- Support for more file formats on local server. [#67].

### Changed
- API for the `search` helper: [#69].
  - Replaced the operator `~=` with `*=`.
  - Added the `<`, `<=`, `>` and `>=` operators.
  - Allowed using the `OR` operator with pipes,
    like `tag1|tag2` or `title=value1|value2`.
  - Added support for numeric values.
  - Added support for date and datetime values.
- The `date("ATOM")` filter uses `Z` instead of `+00:00`. [#64].
- Removed the `hljs` class from the blocks of unhighlighted code. [#71].
- Datetime values in filenames can omit the seconds,
  like in `2021-04-24-18-00_post.md`.

### Fixed
- User options are overridden by default options in the Markdown plugin.
- Changed some filenames to align with the Deno style guide. [#73].
- Updated dependencies. [#63], [#70], [#72], [#76], [#79].
- Improved the CLI help output. [#77].

## [0.17.1] - 2021-04-14
### Added
- New option `-o`/`--open` to open the browser automatically
  when running `lume --serve`. [#62].

### Removed
- The extensions `.html.js` and `.html.ts` introduced in 0.17.0.
  They can be confusing because not all templates must generate HTML pages,
  so `.tmpl.js`/`.tmpl.ts` are more agnostic and fit all cases.

### Fixed
- Updated the `postcss` version to fix source maps.
- Updated the `postcss_import` version to fix the `@charset` at-rule.

## [0.17.0] - 2021-04-11
### Added
- The local IP address is shown on `lume --serve`. [#55].
- Allowed an empty front matter. [#54].
- The extensions `.html.js` and `.html.ts` are processed as pages
  (in order to replace to `.tmpl.js` and `.tmpl.ts`
  that will be removed in the future).
- Added ability to change the sort direction in `search`. [#57].

### Changed
- Deprecated the `permalink` page variable. Use `url` instead. [#46].
- Removed the `permalink` variable in the `paginate` helper that uses `sprintf`.
  Now it accepts only the `url` option that must be a function.

### Fixed
- Improved the slugifier, including a better support for Unicode. [#50], [#56].
- Update the MIME types used by the server. [#51].
- Updated some dependencies. [#59].

## [0.16.6] - 2021-04-04
### Added
- New option `slugifyUrls` to disable the slugifier introduced in 0.16.0. [#44].

## [0.16.5] - 2021-03-29
### Fixed
- Undo the change `only rebuild the site if it's needed`
  due to regression issues.

## [0.16.4] - 2021-03-28
### Added
- Allow to define a function as a `permalink` to generate it dynamically.
- The `permalink` value can have a relative path
  (must start with `./` or `../`) that will be resolved to the directory name.
- The `url` filter allows URLs starting with `~` to reference to source files
  that will be automatically resolved to the final URL.

### Fixed
- When reloading files on `lume --serve`,
  some ignored files weren’t correctly filtered.
- Improved `lume --serve` to only rebuild the site if it’s needed.
- Several changes for Windows compatibility.

## [0.16.3] - 2021-03-21
### Fixed
- The SVG plugin was failed by the SVGO dependency. [#43].

## [0.16.2] - 2021-03-20
### Added
- New, experimental plugin `image` to resize images automatically.

### Fixed
- On merge options, arrays were converted to objects.

## [0.16.1] - 2021-03-14
### Fixed
- The version number.

## [0.16.0] - 2021-03-14
### Added
- New page variable `renderOrder` to control the rendering order of the pages.
- New CLI alias `-s` for `--serve`.

### Changed
- Slugify the paths of all generated pages
  to replace tildes and other conflictive characters
  and to convert them to lowercase.
- Changed the way to generate multiple pages for more flexibility.

### Fixed
- Ensure autogenerated pages aren’t saved if they don’t change (on `--serve`).

## [0.15.4] - 2021-03-08
### Added
- The `date` plugin accepts strings or integer arguments
  (they will be converted to a `Date` with the `new Date(value)` constructor).

### Fixed
- Updated dependencies.

## [0.15.3] - 2021-03-06
### Fixed
- Some issues with paths on Windows. [#41].

## [0.15.2] - 2021-02-22
### Fixed
- The version number.

## [0.15.1] - 2021-02-21
### Added
- Added a second argument for the default exported function of `cli.js`
  to set a site directly.

### Fixed
- Pug templates loaded with `extends` were cached indefinitely. [#39].
- Allow relative paths in the `--root` CLI argument.

## [0.15.0] - 2021-02-05
### Added
- New advanced search features:
  - You can filter by any field at any level, for example
    `search.pages("header.categories=my-category")`.
  - You can sort by any field at any level, for example
    `search.pages("header.categories=my-category", "my.custom.order.field")`.
  - New method `search.data()`
    to return the data assigned to any page or directory.

### Changed
- Restore the ability to return the proper exit code on `lume --run`.
- Show more info on error.
- Removed the parameter to ignore tags in `search.tags()`.
  Replaced with a filter like the one in `search.pages()`.

### Removed
- The method `search.directory()` to return a directory instance.
  Use `search.data()`.
- The option `file` to sort the results of `search.pages()`. Use `url` instead.

### Fixed
- Cache wasn’t correctly refreshed
  when using different versions of plugins. [#35].
- Updated dependencies.
- Ensure the processors are executed in the same order they where defined.
- The `inline` plugin when the site is located in a subdirectory.

## [0.14.0] - 2021-02-02
### Changed
- API for the `Page` class:
  - Tags are stored as an array in `page.data.tags`
    (they were previously contained by a `Set` in `page.tags`).
  - Removed the `page.fullData` property. `page.data` contains the merged data.
- CLI: [#33], [#34].
  - Switched some options (arguments starting with `--`) to commands:
    - `lume --upgrade` to `lume upgrade`
    - `lume --update` to `lume update`
    - `lume --init` to `lume init`
    - `lume --run=<script>` to `lume run <script>`.
  - Added command-specific help output. For example, `lume run --help`.
  - Changed the way to specify a different `cwd`:
    instead of `lume path/to/site`, use `lume --root=path/to/site`.

### Fixed
- Link to the docs in `--help`. [#32].

## [0.13.2] - 2021-01-23
### Fixed
- The incorrect default configuration for YAML plugin.

## [0.13.1] - 2021-01-23
### Fixed
- PostCSS plugins didn’t process CSS files.

## [0.13.0] - 2021-01-20
### Added
- Normalize options across some plugins.

### Changed
- The minimum required Deno version to `1.7.0`.
- Temporarily, `lume --run` doesn’t return the proper exit code until
  [a bug in Deno](https://github.com/denoland/deno/issues/9201) is resolved.

## [0.12.1] - 2021-01-16
### Added
- New command `lume --update` to update the Lume version
  used by any `_config.js` file to the same installed globally in CLI.

### Fixed
- The cache in the `search` helper to return the original array instead a clone,
  so it can be modified outside.
- The uncaught exception in the built-in server due to a broken pipe.

## [0.12.0] - 2021-01-15
### Added
- New filter `njk` registered by the `nunjucks` plugin.
- Moved the `url` filter to a plugin that also creates
  an additional filter `htmlUrl` to search and fix URLs in HTML code.
- New plugin `date` to format date and time values using the library
  [date-fns](https://date-fns.org).
- The sorting parameter of `search.pages()` accepts any key
  (in addition to `date` and `file`).

### Changed
- Moved `attributes` and `classname` to the new `attributes` plugin
  that’s enabled by default.

### Fixed
- The `url` filter with `null` values.
- Improved performance of `search.pages()` by implementing a cache system.
- Improved performance of merging data and tags by implementing a cache system.

## [0.11.0] - 2021-01-12
### Added
- New plugin `inline`.
- New plugin `terser`. [#29], [#30].

### Changed
- Renamed the plugin `css` to `postcss` and renamed some of its options:
  - `map` to `sourceMap`
  - `postcssPlugins` to `plugins`.

### Fixed
- Some files (like layouts) were loaded multiple times.
  Implemented a cache system to ensure that every file is read only once.

## [0.10.8] - 2021-01-03
### Fixed
- Sometimes, the live reload didn’t reload the page,
  even if the changes were sent to the browser. [#20].

## [0.10.7] - 2021-01-02
### Added
- Support for async filters. [#22].
- The events `beforeUpdate` and `afterUpdate` got a property `files`
  with the names of all changed files.
- Allow configuring the CSS plugin with the following options:
  - `postcssPlugins`: an array of the PostCSS plugins [#26].
  - `map`: set `true` to generate source maps.
- Ability to dynamically add or remove pages from processors.

### Fixed
- WebSocket sent update messages twice.
- The `paginate` helper didn’t always return the latest page.
- Dispatching events that contain scripts
  should return `false` if the script fails.

## [0.10.6] - 2020-12-27
### Fixed
- The multipage generation workflow.
- The random WebSocket errors on reloading changes.

## [0.10.5] - 2020-12-25
### Fixed
- The `--location` option being unknown.

## [0.10.4] - 2020-12-24
### Fixed
- Ensure that page tags are always converted to strings.
- The template cache wasn’t always updated.

## [0.10.3] - 2020-12-21
### Fixed
- The `TypeError` on reloading the server.
- Removed extra whitespace when parsing the front matter.
- Improved the Pug plugin.
- The TypeScript errors due to conflicts with Eta. [#18].
- Added cache for the compiled templates.
- Improved filters.
- Added hot reloading for modules (`.ts`, `.js`) and fixed some issues.
- The undocumented `data` filter is disabled by default.

## [0.10.2] - 2020-12-17
### Fixed
- Don’t add the `.html` extension to files with a subextension.
  For example `scripts.js.njk` should be saved as `scripts.js`
  instead of `scripts.js.html`. [#13].
- Refresh the Deno cache with `lume --upgrade`.

## [0.10.1] - 2020-12-16
### Fixed
- The error on handling `<pre>` elements in Markdown.

## [0.10.0] - 2020-12-16
### Added
- New plugin to use Pug as a template engine. [#10].
- New methods `search.previousPage()` and `search.nextPage()`.
- Support for definition lists (`<dl>`) in Markdown.
- Improved the default `404` error page.
  Now it displays a list of files and subdirectories.
- New option `templateEngine` to configure the template engine
  used for every page. [#11]

### Fixed
- Live reload didn’t always work with HTML.
- HTTP server timeout on missing `/index.html`.
- Nunjucks cache didn’t detect the changes to included templates.
- Showing the version on upgrade. [#9].
- `url` filter in Markdown.
- `url` filter to handle hashes and queries
  (such as `#hashid` and `?query=value`)

## [0.9.12] - 2020-12-07
### Fixed
- The `css` plugin uses only the `postcss-import` and `postcss-nesting` plugins
  because the others fail on Deno.

## [0.9.11] - 2020-12-06
### Fixed
- The `lume --upgrade` error.

## [0.9.10] - 2020-12-06
### Fixed
- Updated dependencies.

## [0.9.9] - 2020-12-01
### Fixed
- Async script runner no longer exits before all promises are resolved. [#7].
- Improved the `--upgrade` command.

## [0.9.8] - 2020-12-01
### Fixed
- Removed a failing dependency.

## [0.9.7] - 2020-12-01
### Added
- Support for executing JavaScript functions with `lume.script()`
  along with CLI commands.
- New CLI arguments `--src` and `--dest` to override the corresponding options.
- New property `site.flags` that saves all arguments after double dash,
  like the ones in `lume --serve -- flag1 flag2`.

### Fixed
- Fixed multi-command scripts in Linux. [#7].
- Replaced `dev.jspm.io` with `jspm.dev` for dependencies.
- Replaced `denopkg.com` with `cdn.jsdelivr.net` for dependencies. [#8].
- Updated `highlight.js` to `10.x`.

## [0.9.6] - 2020-11-28
### Fixed
- Creating multiple pages with generators.
- Updated dependencies.
- Simplify the code generated by `lume --init`.
- Multiple commands joined with `&&` and `&`. [#7].

## [0.9.5] - 2020-11-25
### Added
- Support for async generators to create pages.
- Predefined values for `attr` filter.
- New option `server` to configure the local server,
  having properties `port` and `page404`.

### Changed
- Removed the documentation from the main repository.

### Fixed
- The version number returned by `lume -v`.

## [0.9.4] - 2020-11-20
### Fixed
- Broken pipe errors on the server.

## [0.9.3] - 2020-11-13
### Fixed
- The version number returned by `lume -v`.

## [0.9.2] - 2020-11-13
### Added
- CLI command `--upgrade`.

### Changed
- Renamed the `--version` shortcut `-V` to `-v`.

### Fixed
- The `denjucks` installation. [#6].

## [0.9.1] - 2020-11-06
### Fixed
- `@import` CSS of the `css()` plugin, using `_includes` as fallback.

## [0.9.0] - 2020-11-04
### Added
- New method `script()` to execute scripts like a task runner.
- Allow running scripts in events.
- Autodiscover `404.html` in the built-in server to handle the 404 responses.

### Fixed
- Ignore the `node_modules` directory by default.
- Show an error if the `cwd` is not a directory.
- Enable the `attr` filter by default.

## [0.8.1] - 2020-10-28
### Added
- New method `ignore()` to ignore files and directories.

### Fixed
- The version number on `lume --version`.

## [0.8.0] - 2020-10-27
### Added
- New method `loadAssets()` to register asset loaders.
- New CLI argument to build the site in a different directory
  and even to choose a different `_config.js` file.

### Changed
- Renamed `load()` to `loadPages()` and removed the `asset` parameter.
- Renamed `data()` to `loadData()`.
- Renamed `helper()` to `data()`.
- Updating files, when watching, dispatches the events
  `beforeUpdate` and `afterUpdate` (instead of `beforeBuild` and `afterBuild`).

## [0.7.3] - 2020-10-17
### Changed
- Removed the version from the `import` URL in the `_config.js` file
  generated with `--init`.

### Fixed
- Support special characters in the URL on the local server.
- Rebuild inside a `try`…`catch` to prevent death on error.

## [0.7.2] - 2020-10-10
### Fixed
- Updated the version in the CLI.

## [0.7.1] - 2020-10-10
### Fixed
- Permalinks not respecting the `prettyUrls` option. [#1].
- Improved the docs about updating the Lume version.

## [0.7.0] - 2020-10-09
### Added
- Events `beforeBuild` and `afterBuild`.
- Helper `paginate()`.
- Method `site.process()`.
- Option `prettyUrls`, which is `true` by default.

### Removed
- The transformers `site.beforeRender()` and `site.afterRender()`.
  Use `site.process()` instead, which is an equivalent to `afterRender`.

### Fixed
- Improved performance by executing some operations in parallel.
- Page duplications.
- The `url` filter with non-string values.

## [0.6.0] - 2020-09-28
### Added
- New parameter for `search.pages()` to sort pages alphabetically.
- New argument `--help` and aliases `-h` and `-V` for CLI.
- New plugin `eta` to support the `Eta` template engine.
- New method `helper()` to register global helpers
  that can be used in templates.

### Removed
- The parameters `path` and `recursive` in `search.pages()`.

### Fixed
- The `url` filter with relative paths.
- PostCSS incompatibility with Deno.

## [0.5.1] - 2020-09-25
### Fixed
- The `version` variable.

## [0.5.0] - 2020-09-24
### Added
- Ability to generate multiple pages using generators.

### Changed
- Replaced `pathPrefix` and `url` with `location`.

### Fixed
- `url` filter bugs.

## [0.4.0] - 2020-09-22
### Added
- Ability to include the date in the filename.
- New method `search.folder()`.
- New option `--dev` to build in development mode.

### Fixed
- Front matter detection.
- Site rebuild after creating or removing directories and files.
- Improved the `url` filter.
- Use a content hash to detect real file changes.
- Tags propagation.
- Ensure the `beforeRender` transformers are executed only once.

## [0.3.1] - 2020-09-19
### Fixed
- Use a temporary fork of Denjucks to avoid loading bugs.

## [0.3.0] - 2020-09-19
### Added
- New plugin `svg` to optimize SVG files.
- New plugin `dom` to manipulate HTML using the DOM API.
- New filter `classname` to manipulate CSS classes.
- New filter `attributes` to manipulate HTML attributes.
- First tests.

### Changed
- Renamed `explorer` to `search`.

### Fixed
- Refactored source load and reload.
- Explorer returning wrong results.
- Live reload.

## [0.2.3] - 2020-09-14
### Fixed
- Moved the WebSocket script to `server.js` to avoid reading problems.

## [0.2.2] - 2020-09-13
### Added
- New command `lume --version`.

### Fixed
- CLI installation.

## [0.2.1] - 2020-09-13
### Fixed
- Execute the module loader from remote (https://deno.land/x/lume).
- Use fixed versions for dependencies.

## [0.2.0] - 2020-09-13
### Added
- New command `lume --init` to create a `_config.js` file.

### Changed
- Merged the `postcss` and `stylecow` plugins in the new `css` plugin.

### Fixed
- The JSX engine.

## [0.1.0] - 2020-09-13
The first version.

[#1]: https://github.com/lumeland/lume/issues/1
[#6]: https://github.com/lumeland/lume/issues/6
[#7]: https://github.com/lumeland/lume/issues/7
[#8]: https://github.com/lumeland/lume/issues/8
[#9]: https://github.com/lumeland/lume/issues/9
[#10]: https://github.com/lumeland/lume/issues/10
[#11]: https://github.com/lumeland/lume/issues/11
[#13]: https://github.com/lumeland/lume/issues/13
[#18]: https://github.com/lumeland/lume/issues/18
[#20]: https://github.com/lumeland/lume/issues/20
[#22]: https://github.com/lumeland/lume/issues/22
[#26]: https://github.com/lumeland/lume/issues/26
[#29]: https://github.com/lumeland/lume/issues/29
[#30]: https://github.com/lumeland/lume/issues/30
[#32]: https://github.com/lumeland/lume/issues/32
[#33]: https://github.com/lumeland/lume/issues/33
[#34]: https://github.com/lumeland/lume/issues/34
[#35]: https://github.com/lumeland/lume/issues/35
[#39]: https://github.com/lumeland/lume/issues/39
[#41]: https://github.com/lumeland/lume/issues/41
[#43]: https://github.com/lumeland/lume/issues/43
[#44]: https://github.com/lumeland/lume/issues/44
[#45]: https://github.com/lumeland/lume/issues/45
[#46]: https://github.com/lumeland/lume/issues/46
[#50]: https://github.com/lumeland/lume/issues/50
[#51]: https://github.com/lumeland/lume/issues/51
[#53]: https://github.com/lumeland/lume/issues/53
[#54]: https://github.com/lumeland/lume/issues/54
[#55]: https://github.com/lumeland/lume/issues/55
[#56]: https://github.com/lumeland/lume/issues/56
[#57]: https://github.com/lumeland/lume/issues/57
[#59]: https://github.com/lumeland/lume/issues/59
[#62]: https://github.com/lumeland/lume/issues/62
[#63]: https://github.com/lumeland/lume/issues/63
[#64]: https://github.com/lumeland/lume/issues/64
[#67]: https://github.com/lumeland/lume/issues/67
[#69]: https://github.com/lumeland/lume/issues/69
[#70]: https://github.com/lumeland/lume/issues/70
[#71]: https://github.com/lumeland/lume/issues/71
[#72]: https://github.com/lumeland/lume/issues/72
[#73]: https://github.com/lumeland/lume/issues/73
[#76]: https://github.com/lumeland/lume/issues/76
[#77]: https://github.com/lumeland/lume/issues/77
[#79]: https://github.com/lumeland/lume/issues/79
[#81]: https://github.com/lumeland/lume/issues/81
[#82]: https://github.com/lumeland/lume/issues/82
[#83]: https://github.com/lumeland/lume/issues/83
[#85]: https://github.com/lumeland/lume/issues/85
[#87]: https://github.com/lumeland/lume/issues/87
[#88]: https://github.com/lumeland/lume/issues/88
[#90]: https://github.com/lumeland/lume/issues/90
[#91]: https://github.com/lumeland/lume/issues/91
[#93]: https://github.com/lumeland/lume/issues/93
[#94]: https://github.com/lumeland/lume/issues/94
[#95]: https://github.com/lumeland/lume/issues/95
[#97]: https://github.com/lumeland/lume/issues/97
[#98]: https://github.com/lumeland/lume/issues/98
[#105]: https://github.com/lumeland/lume/issues/105
[#107]: https://github.com/lumeland/lume/issues/107
[#108]: https://github.com/lumeland/lume/issues/108
[#109]: https://github.com/lumeland/lume/issues/109
[#110]: https://github.com/lumeland/lume/issues/110
[#114]: https://github.com/lumeland/lume/issues/114
[#115]: https://github.com/lumeland/lume/issues/115
[#116]: https://github.com/lumeland/lume/issues/116
[#117]: https://github.com/lumeland/lume/issues/117
[#120]: https://github.com/lumeland/lume/issues/120
[#125]: https://github.com/lumeland/lume/issues/125
[#131]: https://github.com/lumeland/lume/issues/131
[#136]: https://github.com/lumeland/lume/issues/136
[#139]: https://github.com/lumeland/lume/issues/139
[#147]: https://github.com/lumeland/lume/issues/147
[#149]: https://github.com/lumeland/lume/issues/149
[#150]: https://github.com/lumeland/lume/issues/150
[#155]: https://github.com/lumeland/lume/issues/155
[#157]: https://github.com/lumeland/lume/issues/157
[#158]: https://github.com/lumeland/lume/issues/158
[#159]: https://github.com/lumeland/lume/issues/159
[#162]: https://github.com/lumeland/lume/issues/162
[#163]: https://github.com/lumeland/lume/issues/163
[#164]: https://github.com/lumeland/lume/issues/164
[#169]: https://github.com/lumeland/lume/issues/169
[#170]: https://github.com/lumeland/lume/issues/170
[#175]: https://github.com/lumeland/lume/issues/175
[#180]: https://github.com/lumeland/lume/issues/180
[#181]: https://github.com/lumeland/lume/issues/181
[#182]: https://github.com/lumeland/lume/issues/182
[#184]: https://github.com/lumeland/lume/issues/184
[#187]: https://github.com/lumeland/lume/issues/187
[#188]: https://github.com/lumeland/lume/issues/188
[#189]: https://github.com/lumeland/lume/issues/189
[#190]: https://github.com/lumeland/lume/issues/190
[#191]: https://github.com/lumeland/lume/issues/191
[#192]: https://github.com/lumeland/lume/issues/192
[#193]: https://github.com/lumeland/lume/issues/193
[#194]: https://github.com/lumeland/lume/issues/194
[#196]: https://github.com/lumeland/lume/issues/196
[#197]: https://github.com/lumeland/lume/issues/197
[#198]: https://github.com/lumeland/lume/issues/198
[#202]: https://github.com/lumeland/lume/issues/202
[#203]: https://github.com/lumeland/lume/issues/203
[#205]: https://github.com/lumeland/lume/issues/205
[#206]: https://github.com/lumeland/lume/issues/206
[#207]: https://github.com/lumeland/lume/issues/207
[#209]: https://github.com/lumeland/lume/issues/209
[#210]: https://github.com/lumeland/lume/issues/210
[#214]: https://github.com/lumeland/lume/issues/214
[#215]: https://github.com/lumeland/lume/issues/215
[#218]: https://github.com/lumeland/lume/issues/218
[#221]: https://github.com/lumeland/lume/issues/221
[#223]: https://github.com/lumeland/lume/issues/223
[#227]: https://github.com/lumeland/lume/issues/227
[#228]: https://github.com/lumeland/lume/issues/228
[#229]: https://github.com/lumeland/lume/issues/229
[#233]: https://github.com/lumeland/lume/issues/233
[#234]: https://github.com/lumeland/lume/issues/234
[#239]: https://github.com/lumeland/lume/issues/239
[#240]: https://github.com/lumeland/lume/issues/240
[#241]: https://github.com/lumeland/lume/issues/241
[#243]: https://github.com/lumeland/lume/issues/243
[#246]: https://github.com/lumeland/lume/issues/246
[#247]: https://github.com/lumeland/lume/issues/247
[#248]: https://github.com/lumeland/lume/issues/248
[#249]: https://github.com/lumeland/lume/issues/249
[#250]: https://github.com/lumeland/lume/issues/250
[#251]: https://github.com/lumeland/lume/issues/251
[#252]: https://github.com/lumeland/lume/issues/252
[#253]: https://github.com/lumeland/lume/issues/253
[#254]: https://github.com/lumeland/lume/issues/254
[#255]: https://github.com/lumeland/lume/issues/255
[#259]: https://github.com/lumeland/lume/issues/259
[#260]: https://github.com/lumeland/lume/issues/260
[#267]: https://github.com/lumeland/lume/issues/267
[#268]: https://github.com/lumeland/lume/issues/268
[#269]: https://github.com/lumeland/lume/issues/269
[#271]: https://github.com/lumeland/lume/issues/271
[#272]: https://github.com/lumeland/lume/issues/272
[#274]: https://github.com/lumeland/lume/issues/274
[#276]: https://github.com/lumeland/lume/issues/276
[#278]: https://github.com/lumeland/lume/issues/278
[#279]: https://github.com/lumeland/lume/issues/279
[#280]: https://github.com/lumeland/lume/issues/280
[#283]: https://github.com/lumeland/lume/issues/283
[#284]: https://github.com/lumeland/lume/issues/284
[#285]: https://github.com/lumeland/lume/issues/285
[#286]: https://github.com/lumeland/lume/issues/286
[#287]: https://github.com/lumeland/lume/issues/287
[#288]: https://github.com/lumeland/lume/issues/288
[#291]: https://github.com/lumeland/lume/issues/291
[#292]: https://github.com/lumeland/lume/issues/292
[#293]: https://github.com/lumeland/lume/issues/293
[#295]: https://github.com/lumeland/lume/issues/295
[#296]: https://github.com/lumeland/lume/issues/296
[#299]: https://github.com/lumeland/lume/issues/299
[#301]: https://github.com/lumeland/lume/issues/301
[#308]: https://github.com/lumeland/lume/issues/308
[#316]: https://github.com/lumeland/lume/issues/316
[#320]: https://github.com/lumeland/lume/issues/320
[#321]: https://github.com/lumeland/lume/issues/321
[#323]: https://github.com/lumeland/lume/issues/323
[#324]: https://github.com/lumeland/lume/issues/324
[#327]: https://github.com/lumeland/lume/issues/327
[#328]: https://github.com/lumeland/lume/issues/328
[#329]: https://github.com/lumeland/lume/issues/329
[#334]: https://github.com/lumeland/lume/issues/334
[#337]: https://github.com/lumeland/lume/issues/337
[#338]: https://github.com/lumeland/lume/issues/338
[#339]: https://github.com/lumeland/lume/issues/339
[#340]: https://github.com/lumeland/lume/issues/340
[#341]: https://github.com/lumeland/lume/issues/341
[#342]: https://github.com/lumeland/lume/issues/342
[#343]: https://github.com/lumeland/lume/issues/343
[#344]: https://github.com/lumeland/lume/issues/344
[#346]: https://github.com/lumeland/lume/issues/346
[#348]: https://github.com/lumeland/lume/issues/348
[#351]: https://github.com/lumeland/lume/issues/351
[#353]: https://github.com/lumeland/lume/issues/353
[#357]: https://github.com/lumeland/lume/issues/357
[#358]: https://github.com/lumeland/lume/issues/358
[#359]: https://github.com/lumeland/lume/issues/359
[#364]: https://github.com/lumeland/lume/issues/364
[#369]: https://github.com/lumeland/lume/issues/369
[#374]: https://github.com/lumeland/lume/issues/374
[#383]: https://github.com/lumeland/lume/issues/383
[#384]: https://github.com/lumeland/lume/issues/384
[#386]: https://github.com/lumeland/lume/issues/386
[#387]: https://github.com/lumeland/lume/issues/387
[#388]: https://github.com/lumeland/lume/issues/388
[#390]: https://github.com/lumeland/lume/issues/390
[#395]: https://github.com/lumeland/lume/issues/395
[#398]: https://github.com/lumeland/lume/issues/398
[#400]: https://github.com/lumeland/lume/issues/400
[#401]: https://github.com/lumeland/lume/issues/401
[#403]: https://github.com/lumeland/lume/issues/403
[#406]: https://github.com/lumeland/lume/issues/406
[#407]: https://github.com/lumeland/lume/issues/407
[#409]: https://github.com/lumeland/lume/issues/409
[#411]: https://github.com/lumeland/lume/issues/411
[#413]: https://github.com/lumeland/lume/issues/413
[#417]: https://github.com/lumeland/lume/issues/417
[#418]: https://github.com/lumeland/lume/issues/418
[#419]: https://github.com/lumeland/lume/issues/419
[#426]: https://github.com/lumeland/lume/issues/426
[#431]: https://github.com/lumeland/lume/issues/431
[#432]: https://github.com/lumeland/lume/issues/432
[#433]: https://github.com/lumeland/lume/issues/433
[#434]: https://github.com/lumeland/lume/issues/434
[#441]: https://github.com/lumeland/lume/issues/441
[#442]: https://github.com/lumeland/lume/issues/442
[#445]: https://github.com/lumeland/lume/issues/445
[#447]: https://github.com/lumeland/lume/issues/447
[#448]: https://github.com/lumeland/lume/issues/448
[#449]: https://github.com/lumeland/lume/issues/449
[#450]: https://github.com/lumeland/lume/issues/450
[#451]: https://github.com/lumeland/lume/issues/451
[#462]: https://github.com/lumeland/lume/issues/462
[#463]: https://github.com/lumeland/lume/issues/463
[#466]: https://github.com/lumeland/lume/issues/466
[#467]: https://github.com/lumeland/lume/issues/467
[#468]: https://github.com/lumeland/lume/issues/468
[#469]: https://github.com/lumeland/lume/issues/469
[#470]: https://github.com/lumeland/lume/issues/470
[#473]: https://github.com/lumeland/lume/issues/473
[#480]: https://github.com/lumeland/lume/issues/480
[#481]: https://github.com/lumeland/lume/issues/481
[#482]: https://github.com/lumeland/lume/issues/482
[#487]: https://github.com/lumeland/lume/issues/487
[#488]: https://github.com/lumeland/lume/issues/488
[#490]: https://github.com/lumeland/lume/issues/490
[#492]: https://github.com/lumeland/lume/issues/492
[#496]: https://github.com/lumeland/lume/issues/496
[#502]: https://github.com/lumeland/lume/issues/502
[#504]: https://github.com/lumeland/lume/issues/504

[1.19.4]: https://github.com/lumeland/lume/compare/v1.19.3...HEAD
[1.19.3]: https://github.com/lumeland/lume/compare/v1.19.2...v1.19.3
[1.19.2]: https://github.com/lumeland/lume/compare/v1.19.1...v1.19.2
[1.19.1]: https://github.com/lumeland/lume/compare/v1.19.0...v1.19.1
[1.19.0]: https://github.com/lumeland/lume/compare/v1.18.5...v1.19.0
[1.18.5]: https://github.com/lumeland/lume/compare/v1.18.4...v1.18.5
[1.18.4]: https://github.com/lumeland/lume/compare/v1.18.3...v1.18.4
[1.18.3]: https://github.com/lumeland/lume/compare/v1.18.2...v1.18.3
[1.18.2]: https://github.com/lumeland/lume/compare/v1.18.1...v1.18.2
[1.18.1]: https://github.com/lumeland/lume/compare/v1.18.0...v1.18.1
[1.18.0]: https://github.com/lumeland/lume/compare/v1.17.5...v1.18.0
[1.17.5]: https://github.com/lumeland/lume/compare/v1.17.4...v1.17.5
[1.17.4]: https://github.com/lumeland/lume/compare/v1.17.3...v1.17.4
[1.17.3]: https://github.com/lumeland/lume/compare/v1.17.2...v1.17.3
[1.17.2]: https://github.com/lumeland/lume/compare/v1.17.1...v1.17.2
[1.17.1]: https://github.com/lumeland/lume/compare/v1.17.0...v1.17.1
[1.17.0]: https://github.com/lumeland/lume/compare/v1.16.2...v1.17.0
[1.16.2]: https://github.com/lumeland/lume/compare/v1.16.1...v1.16.2
[1.16.1]: https://github.com/lumeland/lume/compare/v1.16.0...v1.16.1
[1.16.0]: https://github.com/lumeland/lume/compare/v1.15.3...v1.16.0
[1.15.3]: https://github.com/lumeland/lume/compare/v1.15.2...v1.15.3
[1.15.2]: https://github.com/lumeland/lume/compare/v1.15.1...v1.15.2
[1.15.1]: https://github.com/lumeland/lume/compare/v1.15.0...v1.15.1
[1.15.0]: https://github.com/lumeland/lume/compare/v1.14.2...v1.15.0
[1.14.2]: https://github.com/lumeland/lume/compare/v1.14.1...v1.14.2
[1.14.1]: https://github.com/lumeland/lume/compare/v1.14.0...v1.14.1
[1.14.0]: https://github.com/lumeland/lume/compare/v1.13.2...v1.14.0
[1.13.2]: https://github.com/lumeland/lume/compare/v1.13.1...v1.13.2
[1.13.1]: https://github.com/lumeland/lume/compare/v1.13.0...v1.13.1
[1.13.0]: https://github.com/lumeland/lume/compare/v1.12.1...v1.13.0
[1.12.1]: https://github.com/lumeland/lume/compare/v1.12.0...v1.12.1
[1.12.0]: https://github.com/lumeland/lume/compare/v1.11.4...v1.12.0
[1.11.4]: https://github.com/lumeland/lume/compare/v1.11.3...v1.11.4
[1.11.3]: https://github.com/lumeland/lume/compare/v1.11.2...v1.11.3
[1.11.2]: https://github.com/lumeland/lume/compare/v1.11.1...v1.11.2
[1.11.1]: https://github.com/lumeland/lume/compare/v1.11.0...v1.11.1
[1.11.0]: https://github.com/lumeland/lume/compare/v1.10.4...v1.11.0
[1.10.4]: https://github.com/lumeland/lume/compare/v1.10.3...v1.10.4
[1.10.3]: https://github.com/lumeland/lume/compare/v1.10.2...v1.10.3
[1.10.2]: https://github.com/lumeland/lume/compare/v1.10.1...v1.10.2
[1.10.1]: https://github.com/lumeland/lume/compare/v1.10.0...v1.10.1
[1.10.0]: https://github.com/lumeland/lume/compare/v1.9.1...v1.10.0
[1.9.1]: https://github.com/lumeland/lume/compare/v1.9.0...v1.9.1
[1.9.0]: https://github.com/lumeland/lume/compare/v1.8.0...v1.9.0
[1.8.0]: https://github.com/lumeland/lume/compare/v1.7.4...v1.8.0
[1.7.4]: https://github.com/lumeland/lume/compare/v1.7.3...v1.7.4
[1.7.3]: https://github.com/lumeland/lume/compare/v1.7.2...v1.7.3
[1.7.2]: https://github.com/lumeland/lume/compare/v1.7.1...v1.7.2
[1.7.1]: https://github.com/lumeland/lume/compare/v1.7.0...v1.7.1
[1.7.0]: https://github.com/lumeland/lume/compare/v1.6.4...v1.7.0
[1.6.4]: https://github.com/lumeland/lume/compare/v1.6.3...v1.6.4
[1.6.3]: https://github.com/lumeland/lume/compare/v1.6.2...v1.6.3
[1.6.2]: https://github.com/lumeland/lume/compare/v1.6.1...v1.6.2
[1.6.1]: https://github.com/lumeland/lume/compare/v1.6.0...v1.6.1
[1.6.0]: https://github.com/lumeland/lume/compare/v1.5.1...v1.6.0
[1.5.1]: https://github.com/lumeland/lume/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/lumeland/lume/compare/v1.4.3...v1.5.0
[1.4.3]: https://github.com/lumeland/lume/compare/v1.4.2...v1.4.3
[1.4.2]: https://github.com/lumeland/lume/compare/v1.4.1...v1.4.2
[1.4.1]: https://github.com/lumeland/lume/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/lumeland/lume/compare/v1.3.1...v1.4.0
[1.3.1]: https://github.com/lumeland/lume/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/lumeland/lume/compare/v1.2.1...v1.3.0
[1.2.1]: https://github.com/lumeland/lume/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/lumeland/lume/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/lumeland/lume/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/lumeland/lume/compare/v1.0.5...v1.1.0
[1.0.5]: https://github.com/lumeland/lume/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/lumeland/lume/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/lumeland/lume/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/lumeland/lume/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/lumeland/lume/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/lumeland/lume/compare/v0.25.5...v1.0.0
[0.25.5]: https://github.com/lumeland/lume/compare/v0.25.4...v0.25.5
[0.25.4]: https://github.com/lumeland/lume/compare/v0.25.3...v0.25.4
[0.25.3]: https://github.com/lumeland/lume/compare/v0.25.2...v0.25.3
[0.25.2]: https://github.com/lumeland/lume/compare/v0.25.1...v0.25.2
[0.25.1]: https://github.com/lumeland/lume/compare/v0.25.0...v0.25.1
[0.25.0]: https://github.com/lumeland/lume/compare/v0.24.0...v0.25.0
[0.24.0]: https://github.com/lumeland/lume/compare/v0.23.3...v0.24.0
[0.23.3]: https://github.com/lumeland/lume/compare/v0.23.2...v0.23.3
[0.23.2]: https://github.com/lumeland/lume/compare/v0.23.1...v0.23.2
[0.23.1]: https://github.com/lumeland/lume/compare/v0.23.0...v0.23.1
[0.23.0]: https://github.com/lumeland/lume/compare/v0.22.6...v0.23.0
[0.22.6]: https://github.com/lumeland/lume/compare/v0.22.5...v0.22.6
[0.22.5]: https://github.com/lumeland/lume/compare/v0.22.4...v0.22.5
[0.22.4]: https://github.com/lumeland/lume/compare/v0.22.3...v0.22.4
[0.22.3]: https://github.com/lumeland/lume/compare/v0.22.2...v0.22.3
[0.22.2]: https://github.com/lumeland/lume/compare/v0.22.1...v0.22.2
[0.22.1]: https://github.com/lumeland/lume/compare/v0.22.0...v0.22.1
[0.22.0]: https://github.com/lumeland/lume/compare/v0.21.1...v0.22.0
[0.21.1]: https://github.com/lumeland/lume/compare/v0.21.0...v0.21.1
[0.21.0]: https://github.com/lumeland/lume/compare/v0.20.2...v0.21.0
[0.20.2]: https://github.com/lumeland/lume/compare/v0.20.1...v0.20.2
[0.20.1]: https://github.com/lumeland/lume/compare/v0.20.0...v0.20.1
[0.20.0]: https://github.com/lumeland/lume/compare/v0.19.0...v0.20.0
[0.19.0]: https://github.com/lumeland/lume/compare/v0.18.1...v0.19.0
[0.18.1]: https://github.com/lumeland/lume/compare/v0.18.0...v0.18.1
[0.18.0]: https://github.com/lumeland/lume/compare/v0.17.1...v0.18.0
[0.17.1]: https://github.com/lumeland/lume/compare/v0.17.0...v0.17.1
[0.17.0]: https://github.com/lumeland/lume/compare/v0.16.6...v0.17.0
[0.16.6]: https://github.com/lumeland/lume/compare/v0.16.5...v0.16.6
[0.16.5]: https://github.com/lumeland/lume/compare/v0.16.4...v0.16.5
[0.16.4]: https://github.com/lumeland/lume/compare/v0.16.3...v0.16.4
[0.16.3]: https://github.com/lumeland/lume/compare/v0.16.2...v0.16.3
[0.16.2]: https://github.com/lumeland/lume/compare/v0.16.1...v0.16.2
[0.16.1]: https://github.com/lumeland/lume/compare/v0.16.0...v0.16.1
[0.16.0]: https://github.com/lumeland/lume/compare/v0.15.4...v0.16.0
[0.15.4]: https://github.com/lumeland/lume/compare/v0.15.3...v0.15.4
[0.15.3]: https://github.com/lumeland/lume/compare/v0.15.2...v0.15.3
[0.15.2]: https://github.com/lumeland/lume/compare/v0.15.1...v0.15.2
[0.15.1]: https://github.com/lumeland/lume/compare/v0.15.0...v0.15.1
[0.15.0]: https://github.com/lumeland/lume/compare/v0.14.0...v0.15.0
[0.14.0]: https://github.com/lumeland/lume/compare/v0.13.2...v0.14.0
[0.13.2]: https://github.com/lumeland/lume/compare/v0.13.1...v0.13.2
[0.13.1]: https://github.com/lumeland/lume/compare/v0.13.0...v0.13.1
[0.13.0]: https://github.com/lumeland/lume/compare/v0.12.1...v0.13.0
[0.12.1]: https://github.com/lumeland/lume/compare/v0.12.0...v0.12.1
[0.12.0]: https://github.com/lumeland/lume/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/lumeland/lume/compare/v0.10.8...v0.11.0
[0.10.8]: https://github.com/lumeland/lume/compare/v0.10.7...v0.10.8
[0.10.7]: https://github.com/lumeland/lume/compare/v0.10.6...v0.10.7
[0.10.6]: https://github.com/lumeland/lume/compare/v0.10.5...v0.10.6
[0.10.5]: https://github.com/lumeland/lume/compare/v0.10.4...v0.10.5
[0.10.4]: https://github.com/lumeland/lume/compare/v0.10.3...v0.10.4
[0.10.3]: https://github.com/lumeland/lume/compare/v0.10.2...v0.10.3
[0.10.2]: https://github.com/lumeland/lume/compare/v0.10.1...v0.10.2
[0.10.1]: https://github.com/lumeland/lume/compare/v0.10.0...v0.10.1
[0.10.0]: https://github.com/lumeland/lume/compare/v0.9.12...v0.10.0
[0.9.12]: https://github.com/lumeland/lume/compare/v0.9.11...v0.9.12
[0.9.11]: https://github.com/lumeland/lume/compare/v0.9.10...v0.9.11
[0.9.10]: https://github.com/lumeland/lume/compare/v0.9.9...v0.9.10
[0.9.9]: https://github.com/lumeland/lume/compare/v0.9.8...v0.9.9
[0.9.8]: https://github.com/lumeland/lume/compare/v0.9.7...v0.9.8
[0.9.7]: https://github.com/lumeland/lume/compare/v0.9.6...v0.9.7
[0.9.6]: https://github.com/lumeland/lume/compare/v0.9.5...v0.9.6
[0.9.5]: https://github.com/lumeland/lume/compare/v0.9.4...v0.9.5
[0.9.4]: https://github.com/lumeland/lume/compare/v0.9.3...v0.9.4
[0.9.3]: https://github.com/lumeland/lume/compare/v0.9.2...v0.9.3
[0.9.2]: https://github.com/lumeland/lume/compare/v0.9.1...v0.9.2
[0.9.1]: https://github.com/lumeland/lume/compare/v0.9.0...v0.9.1
[0.9.0]: https://github.com/lumeland/lume/compare/v0.8.1...v0.9.0
[0.8.1]: https://github.com/lumeland/lume/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/lumeland/lume/compare/v0.7.3...v0.8.0
[0.7.3]: https://github.com/lumeland/lume/compare/v0.7.2...v0.7.3
[0.7.2]: https://github.com/lumeland/lume/compare/v0.7.1...v0.7.2
[0.7.1]: https://github.com/lumeland/lume/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/lumeland/lume/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/lumeland/lume/compare/v0.5.1...v0.6.0
[0.5.1]: https://github.com/lumeland/lume/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/lumeland/lume/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/lumeland/lume/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/lumeland/lume/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/lumeland/lume/compare/v0.2.3...v0.3.0
[0.2.3]: https://github.com/lumeland/lume/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/lumeland/lume/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/lumeland/lume/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/lumeland/lume/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/lumeland/lume/releases/tag/v0.1.0
