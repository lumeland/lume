---
title: CSS
---

The CSS plugin **is disabled by default** so to enable it you have to import and use it in the `_config.js` file:


```js
import css from "https://deno.land/x/lume/plugins/css.js";
  
site.use(css());
```

This plugin loads CSS files and use [PostCSS](https://postcss.org/) with [postcss-preset-env](https://preset-env.cssdb.org/) to transform the code so most browsers can understand (adding polyfills for modern features, autoprefixer, etc). It also resolve the local `@imports` with relative urls. For example:

```css
@import "./_includes/reset.css";
@import "./_includes/variables.css";
@import "./_includes/components/button.css";
@import "./_includes/components/input.css";
```