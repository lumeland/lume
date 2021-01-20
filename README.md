# 🔥Lume

**lume** is the galician word for _fire_, but also a (yet another) static site
generator for [Deno](https://deno.land/).

It's inspired in other general purpose static site generators such
[Jekyll](https://jekyllrb.com/) or [Eleventy](https://www.11ty.dev/) but it's
faster, simpler and easier to use and configure, besides being super flexible.

- Support for **multiple file formats** like `markdown`, `yaml`, `javascript`,
  `typescript`, `jsx`, `nunjucks` and it's easy to extend.
- You can hook **any processor** to transform assets, like `sass` or `postcss`
  for CSS.
- It's Deno: forget about manage thousand of packages in `node_modules` or
  complex bundlers. Lume only install that you need. Clean, fast and secure.

---

- [See the Docs to learn more](https://lumeland.github.io/)
- [Propose new ideas and get help at Discord](https://discord.gg/YbTmpACHWB)

---

## Quick start

Make sure you have [Deno installed](https://deno.land/#installation).

Create your first page, for example using a nunjucks template:

```html
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

Run it:

```
deno run --unstable -A https://deno.land/x/lume/cli.js
```

This command will compile your documents to HTML and save them into the folder
`_site`.

---

Please see [CHANGELOG](CHANGELOG.md) for more information about recent changes.

The MIT License (MIT). Please see [LICENSE](LICENSE) for more information.
