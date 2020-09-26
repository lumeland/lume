---
title: Layouts
---

Layouts are templates that wrap around your content. They allow you to have the source code for your template in one place so you don’t have to repeat things like the navigation and footer on every page.

Layout files are loaded from a special folder named `_includes`. This folder can contain not only layouts but other files, so a good practice is to save them in a subfolder like `_includes/layouts`.

In the following page, we have defined the variable `layout` with the name of the template that we want to use:

```yml
---
title: This is the front matter
layout: layouts/main.njk
---

# This is the page content
Here you can write markdown content

```

**Lume** has support for many template engines. In this example, the layout file has the extension `njk`, used by the [Nunjucks](https://mozilla.github.io/nunjucks/) template engine:

```html
<!doctype html>

<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>{{ title }}</title>
  </head>

  <body>
    <main>
      {{ content | safe }}
    </main>
  </body>
</html>
```

**Lume** will search the file `_includes/layouts/main.njk` (note that all layouts are relative to `_includes` folder).

The template can use any variable from the page, for example `title` to render the title, and `content` with the rendered markdown content of the page.

## Layout front matter

Layouts can have also front matters with variables that will be merged with the variables from the page. Note that variables defined in the pages have precedence over the variables in the layouts. This means that you can set default values in the layouts and override them within the pages.

A layout can be wrapped around another layout. Just set a `layout` variable in front matter. In this example, the following layout uses the `layouts/main.njk` layout as a wrapper.

```html
---
title: Default title
language: en
layout: layouts/main.njk
---

<article lang="{{ language }}">
  <header>
    <h1>{{ title }}</h1>
  </header>

  {{ content | safe }}
</article>
```
