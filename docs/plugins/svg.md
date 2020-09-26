---
title: SVG
---

The plugin SVG **is disabled by default** so to enable it you have to import and use it in the `_config.js` file:

```js
import svg from "https://deno.land/x/lume/plugins/svg.js";
  
site.use(svg());
```

This plugin load `.svg` files and optimize them using [SVGO](https://github.com/svg/svgo)