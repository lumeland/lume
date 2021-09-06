# 🔥Lume

**Lume** is the Galician word for _fire_ but also a (yet another) static site
generator for [Deno](https://deno.land/).

It’s inspired by other general-purpose static site generators, such as
[Jekyll](https://jekyllrb.com/) and [Eleventy](https://www.11ty.dev/), but it’s
faster, simpler and easier to use and configure, besides being super flexible.

- Supports **multiple file formats**, like Markdown, YAML, JavaScript,
  TypeScript, JSX and Nunjucks, and it’s easy to extend.
- You can hook **any processor** to transform assets, like Terser for Javascript
  or PostCSS for CSS.
- It’s Deno: Forget about managing thousands of packages in `node_modules` or
  complex bundlers. Lume only installs what you need. Clean, fast and secure.

---

- [See the docs to learn more](https://lumeland.github.io/)
- [Propose new ideas and get help at Discord](https://discord.gg/YbTmpACHWB)

---

## Quick start

Make sure you have [Deno installed](https://deno.land/#installation).

Create your first page, for example, using the Nunjucks file `index.njk`:

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

Build it:

```
deno run -A https://deno.land/x/lume/ci.ts
```

This command will compile your documents to HTML and save them into the
directory `_site`.

---

Please see [CHANGELOG](CHANGELOG.md) for information about the recent changes.

Licensed under the MIT License. See [LICENSE](LICENSE) for more information.
