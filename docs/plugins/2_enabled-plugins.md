---
title: Default plugins
---

Some core plugins are enabled by default:

## json

JSON plugin allows to define data files and pages in json:

- To create a data file, just add a `_data.json` file in your site, or `*.json` files inside `_data` folders.
- To create a page, you have to use the extension `.tmpl.json`.

## markdown

Markdown plugin add support for markdown format:

- Allow create pages in markdown by adding files with `.md` or `.markdown` extension
- It also register the template filter `md` to render any markdown value to html

## modules

Modules plugin allows to create data files and pages as ES6 modules:

- To create a data file, just add a `_data.js` or `_data.ts` file in your site, or `*.js` or `*.ts` files inside `_data` folders.
- To create a page, you have to use the `.tmpl.js` or `.tmpl.ts` extensions.

## nunjucks

This plugin allows to use [Nunjucks](https://mozilla.github.io/nunjucks/) template engine to create pages and layouts. To do that, add files with `.njk` extension. Files with the extension `.html` are also rendered with nunjucks.

## yaml

Yaml plugin allows to define data files and pages in yaml format.

- To create a data file, just add a `_data.yaml` or `_data.yml` file in your site, or `*.yml` or `*.yaml` files inside `_data` folders.
- To create a page, you have to use the extension `.yaml` or `.yml`.
