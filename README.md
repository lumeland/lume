# 🔥Lume (Work in progress)

**lume** is the galician word for *fire*, but also a (yet another) static site generator for [Deno](https://deno.land/).

It's inspired in other general purpose static site generators such [Jekyll](https://jekyllrb.com/) or [Eleventy](https://www.11ty.dev/) but it's faster, simpler and easier to use and configure, besides being super flexible.

- Support for **multiple file formats** like `markdown`, `yaml`, `javascript`, `typescript`, `jsx`, `nunjucks` and it's easy to extend.
- You can hook **any processor** to transform assets, like `sass` or `postcss` for CSS.
- It's Deno: forget about manage thousand of packages in `node_modules` or complex bundlers. Lume only install that you need. Clean, fast and secure.

## Quick start

- Make sure you have [Deno installed](https://deno.land/#installation).
- Install **lume** as a Deno executable:
  ```
  deno install --unstable --allow-read --allow-write --allow-net https://deno.land/x/lume/cli.js
  ```
- Create your first page, for example using a nunjucks template:
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
- Run it: `lume`
- This command will compile your documents to HTML and saved into the output folder (defaults to `_site`)
- You can run `lume --serve` to start up a webserver. Then open `http://localhost:3000` in your web browser to see your website.

---

## Docs

[Access to the Docs to learn more](https://oscarotero.github.io/lume/)
