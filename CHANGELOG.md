<!-- deno-fmt-ignore-file -->

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.7.3] - Unreleased
### Added
- New option `--version` to `lume upgrade`, to set a specific version to upgrade.

### Changed
- Simplified `lume init` command:
  - Doesn't ask the import style. Always use `import lume from "lume/mod.ts"`.
  - Doesn't ask whether create a import map file. It's created always.
- Simplified `import_map.json` file generation:
  Only `lume/` import is added. `lume` and `https://deno.land/x/lume/` are removed.
  The main reason is it's more easy to manage and with the new tasks and importMap keys in the `deno.json` file there's no need to do magic stuff.

### Fixed
- Updated `std`, `esbuild`, `deno_dom`, `parcel-css` and `react`.
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
- Updated dependecies: `std`, `esbuild`, `deno_graph`, `markdown_it`, `liquidjs`, `parcel_css` and `postcss`.
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
- You can add processors and preprocessors to run in all pages with `site.process("*", processFunction)`.
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
  - Many core classes have been splitted into different small classes
    with single responsabilities (SOLID principles).
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
- Removed unnecesary file system checkings.
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
  Previously it was overriden, causing inconsistencies.
- The local server returns a `301` response for folders without trailing slash.
  For example: `/about-us -> /about-us/`.

### Removed
- BREAKING: Markdown no longer modify the links automatically.
  Use `resolve_links` plugin.
- BREAKING: Removed the `entries` argument of `bundler` plugin.
  (sorry, it was a bad idea)

### Fixed
- Processors take into account the extension of the source file,
  in addition to the output extension to match with preprocessors behavior.
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
  - The `entries` array items dont't need to start with `/`.
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
- Internal changes to how the processors and preprocessors are handled
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
- Some preprocessors were executed several times. [#110].
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

[1.7.3]: https://github.com/lumeland/lume/compare/v1.7.2...HEAD
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
