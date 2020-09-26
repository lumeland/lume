---
title: Markdown
---

[Markdown](https://en.wikipedia.org/wiki/Markdown) is a popular markup language to write content that is converted to html. This format is **enabled by default** and is useful for pages with long text like posts or articles.

## Creating pages in markdown

To create a page using *markdown*, just add a file with `.md` or `.markdown` extension to your site. You can also add extra variables by including a *front matter,* a block delimited by two triple-dashed lines with YAML code:

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

## md filter

The markdown plugin also register the `md` filter, to render any string value as markdown and output a html. The filter also accepts an argument to render the markdown in *inline* mode.

```html
<!-- Render to html code -->
<div>{{ text | md }}<div>

<!-- Single line rendering, without paragraph wrap: -->
<p>{{ text | md(true) }}<p>
```
