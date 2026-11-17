# 🔥Lume

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)

**Lume** is the Galician word for _fire_ but also a (yet another) static site
generator for Node. Previous Lume versions were available for Deno.

It’s inspired by other general-purpose static site generators, such as
[Jekyll](https://jekyllrb.com/) and [Eleventy](https://www.11ty.dev/), but it’s
faster, simpler and easier to use and configure, besides being super flexible.

- Supports **multiple file formats**, like Markdown, YAML, JavaScript,
  TypeScript, JSX, [Vento](https://vento.js.org/) and Nunjucks, and it’s easy to
  extend.
- You can hook **any processor** to transform assets, like Terser for Javascript
  or PostCSS for CSS.

---

- [Read the docs to learn more](https://lume.land/docs/overview/about-lume/)
- [Propose new ideas and get help at Discord](https://discord.gg/YbTmpACHWB)
- If you like the project and want to provide some support,
  [see our Open Collective organization](https://opencollective.com/lume)

---

## v4

🔥 Lume 4.0 [has been released](https://lume.land/blog/posts/lume-4/) and ported
to Node. See the
[migration guide](https://lume.land/docs/advanced/migrate-to-lume4/).

The tags in this repo are for v3 and older versions. Previous Lume releases for
Deno relied on git tags. v4 is a monorepo and it’s not tagged anymore.

**Lume 4 runs on Node,** so make sure you have version 24 LTS or newer
installed. See [Node documentation](https://nodejs.org/en/download) for more
info.

The code is published on NPM under the
[`@lumeland` organization](https://www.npmjs.com/org/lumeland):

- The main package is
  [`@lumeland/lume`](https://www.npmjs.com/package/@lumeland/lume).
- Plugins have the name format `@lumeland/plugin-*` (for example
  [@lumeland/plugin-esbuild](https://www.npmjs.com/package/@lumeland/plugin-esbuild))
  and must be installed independently.

For more detailed information, please refer to the
[migration guide](https://lume.land/docs/advanced/migrate-to-lume4/) and the
[v4 release post](https://lume.land/blog/posts/lume-4/). If, after consulting
those, you are still having trouble migrating, please reach out on
[Discord](https://discord.gg/YbTmpACHWB) or open an issue.

## Quick start

### Lume `init` vs `npm create lume`

The way to setup Lume 3 for new projects is using the init script
`deno run -A https://lume.land/init.ts`. The equivalent script in Lume 4 is
`npm create lume@latest` (`@latest` ensures npm uses the newest version of Lume
to create the site, even if you have older versions in your npm
[cache](https://docs.npmjs.com/cli/commands/npm-cache)). You can specify the
project folder in the first argument. For example `npm create lume@latest .`
will create a new project (an empty site) in the current folder.

The script detects if the folder already contains a Lume project and will ask
you to migrate it to Node. If you confirm this action, it will create the files
`package.json` and `tsconfig.json` and will install all dependencies detected in
the `deno.json` and `_config.ts` files.

Note that this migration may not be complete. Depending on your site and
configuration, maybe you need additional changes in your code. The script
doesn’t remove the Deno files (`deno.json` and company), it only creates the new
files. So once your site is completely migrated, you will need to remove these
files by yourself.

You can also start a site with one of the
[available themes](https://lume.land/themes/), like
[Simple Blog](https://lume.land/theme/simple-blog/):

```sh
npm create lume@latest -- --theme @lumeland/theme-simple-blog
```

### Lume from scratch

For example, create your first page using the Vento file `index.vto`:

```vto
---
title: Welcome to my page
---
<html>
  <head>
    <title>{{ title }}</title>
  </head>
  <body>
    <h1>{{ title }}</h1>
  </body>
</html>
```

Build it:

```sh
npx @lumeland/lume@latest build
```

This command will compile your documents to HTML and save them into the
directory `_site`.

---

Please see the [CHANGELOG](./packages/lume/CHANGELOG.md) for the specifics of
recent changes.

Licensed under the MIT License. See [LICENSE](LICENSE) for more information.
