---
title: Eta
---

[Eta](https://eta.js.org/) is a javascript template engine with a syntax very similar to EJS but with [some differences](https://eta.js.org/docs/about/eta-vs-ejs). This format is **disabled by default**, so you have to enable it in the `_config.js` file:

```js
import eta from "https://deno.land/x/lume/plugins/eta.js";

site.use(eta());
```

## Creating layouts

Add a file with `.eta` extension in the `_includes` folder. Use the *front matter* to set data to the template.

```html
---
title: Welcome to my page
intro: This is my first post using lume, I hope you like it!
---

<html>
  <head>
    <title><%= title %></title>
  </head>

  <body>
    <%~ includeFile("partials/nav.eta") %>

    <p><%= title %></p>
  </body>
</html>
```

Note that the paths passed to `includeFile()` function are always relative to `_includes` folder.

## Creating pages

Creating pages is the same as creating layouts, just place the `.eta` file outside the `_includes` folder.
