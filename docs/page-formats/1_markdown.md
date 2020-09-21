---
title: Markdown
---

[Markdown](https://en.wikipedia.org/wiki/Markdown) is a popular markup language to write content that is converted to html. This format is **enabled by default** and is useful for pages with long text like posts or articles. To create a page using *markdown*, just add a file with `.md` or `.markdown` extension to your site.

To add extra variables to *markdown* files you can add a *front matter,* a block delimited by two triple-dashed lines with YAML code. Markdown cannot generate a full HTML page (with `<header>` and `<body>`), so you may need to configure a layout:

```yaml
---
title: Welcome to my page
layout: layouts/main.njk
---

# Welcome

**This is my first post** using lume
I hope you like it!
```

The markdown code is stored in the `content` variable:

```html
<html>
  <head>
    <title>{{ title }}</title>
  </head>
  <body>
    {{ content | safe }}
  </body>
</html>
```
