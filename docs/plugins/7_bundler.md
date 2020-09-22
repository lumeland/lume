---
title: Bundler
---

The plugin Bundler **is disabled by default** so to enable it you have to import and use it in the `_config.js` file:

```js
import bundler from "https://deno.land/x/lume/plugins/bundler.js";
  
site.use(bundler());
```

This plugin load `.js` and `.ts` files and output a single Javascript file including all dependencies of the input. Internally uses the [bundle](https://deno.land/manual/tools/bundler) Deno tool.