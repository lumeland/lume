---
title: Configuration
---

**Lume** uses the `_config.js` file that gives you a lot of flexibility to customize how it build your site. This file must be placed in the site's root directory, and you can create it by your own or with the following command:

```sh
lume --init
```

The `_config.js` file is a javascript module that exports the lume instance. The minimal required code is:

```js
import lume from "https://deno.land/x/lume/mod.js";
  
const site = lume({
  src: ".",
  dest: "_site",
});

// Add other stuff here

export default site;
```

The available options are the following:

Name   | Required | Description
-------|----------|------------
`src`  | Yes      | The source directory where lume read your files
`dest` | Yes      | The destination to output the site
`dev`  | No       | Build the site in development mode or not. It's `false` by default and you can use `--dev` flag to set to true

## Installing plugins

Plugins add extra functionality or support for new formats. There are some basic plugins installed by default (like support for `markdown`, `yaml` or `json` formats), but there are other plugins that you have to enable. For example, to enable the svg plugin (that optimize svg files), you have to import and load in the config file:

```js
import svg from "https://deno.land/x/lume/plugins/svg.js";

site.use(svg());
```

## Copy static files

Static files are files that don't have to be processed, like images, pdfs, video or audio. So it's better (and faster) to copy directly these files to dest folder with the `copy` function:

```js
// Copy the "img" folder to _site/img
site.copy("img");

// Copy the file to _site/favicon.ico
site.copy("favicon.ico");
```

The path is relative to the root's of the src directory and the files and folders are copies as is, maintaining the same folder structure. If you want to change the output directory, use the second argument. For example:

```js
// Copy the "img" folder to _site/images
site.copy("img", "images");

// Copy the "static-files/favicons/favicon.ico" to _site/favicon.ico
site.copy("static-files/favicons/favicon.ico", "favicon.ico");
```

## Template filters

Template filters are functions that you can use in your layouts to modify content. Some template engines like Nunkucks [have several builtin filters](https://mozilla.github.io/nunjucks/templating.html#builtin-filters), but you can add your owns:

```js
// Filter to convert a string to uppercase
site.filter("uppercase", (value) => value.toUpperCase());
```

Now, use it in your Nunkucks templates:

```html
<h1>{{ title | uppercase }}</h1>
```
