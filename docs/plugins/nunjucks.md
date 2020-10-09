---
title: Nunjucks
---

[Nunjucks](https://mozilla.github.io/nunjucks/) is powerful template language created by Mozilla and inspired by **ninja2**. This format is **enabled by default** and you can use it not only for page layouts, but also to create pages.

## Creating layouts

Add a file with `.njk` or `.html` extension in the `_includes` folder. Use the *front matter* to set data to the template.

```html
---
title: Welcome to my page
intro: This is my first post using lume, I hope you like it!
---

<html>
  <head>
    <title>{{ title }}</title>
  </head>

  <body>
    <p>{{ intro }}</p>
  </body>
</html>
```

## Creating pages

Creating pages is the same as creating layouts, just place the `.njk` or `.html` file outside the `_includes` folder.
