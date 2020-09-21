---
title: DOM
---

DOM plugin **is disabled by default** so to enable it you have to import and use it in the `_config.js` file. This plugin allows to perform some HTML transformations using the standard DOM API before export the pages. For example:

```js
import css from "https://deno.land/x/lume/plugins/dom.js";

site.use(dom((document) => {
  document.querySelectorAll('a[href^="https://"]')
    .forEach(link => link.setAttribute("target", "_blank"));
}));
```