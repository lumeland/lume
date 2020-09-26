---
title: About plugins
---

**Lume** has a plugin system that allows to extend its functionality with new features and support for more formats. Some of these plugins are enabled by default, others need to be enabled in the `_config.js` file.

To enable a plugin, just import the plugin module and use the `use()` function. For example:

```js
import lume from "https://deno.land/x/lume/mod.js";
import jsx from "https://deno.land/x/lume/plugins/jsx.js";
  
const site = lume();

// Enable the JSX plugin
site.use(jsx());

export default site;
```

**Lume** includes some plugins enabled by default:

- [Markdown](/plugins/markdown)
- [JSON](/plugins/json)
- [Modules](/plugins/modules)
- [Nunjucks](/plugins/nunjucks)
- [Yaml](/plugins/yaml)
