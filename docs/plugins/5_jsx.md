---
title: JSX
---

The plugin JSX **is disabled by default** so to enable it you have to import and use it in the `_config.js` file:

```js
import jsx from "https://deno.land/x/lume/plugins/jsx.js";
  
site.use(jsx());
```

This plugin enable the support for `.jsx` and `.tsx` files. See [JSX/TSX formats](/page-formats/jsx/) for more info.