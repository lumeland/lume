---
title: Layouts
---

Layouts are templates that wrap around your content. They allow you to have the source code for your template in one place so you don’t have to repeat things like your navigation and footer on every page.

The template files are saved in a special folder named `_includes`. This folder can contain not only layouts but other files, so a good practice is to save your layouts in a subfolder, for example `_includes/layouts`.

Let's say we have this page, with the variable `layout` in the page front matter:

```yml
---
title: This is the front matter
layout: layouts/main.njk
---

# This is the page content
Here you can write markdown content

```

**lume** has support for many template engines. This example uses [Nunjucks](https://mozilla.github.io/nunjucks/) and a layout named `main.njk`:

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

The template has access to the page variables: the variable `title` is used to render the title in the template, and the content of the page is stored in the variable `content`.

## Layout front matter

Layouts can contain front matters with more data that will be merged with the page data. Let's see this example:

```html
---
title: Default title
language: en
---

<!doctype html>

<html lang="{{ language }}">
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

In this example, the layout has a front matter with two variables that are used in the html code. Note that variables defined in the pages have precedence over the variables in the layouts. This means that you can set default values in the layouts and override them within the pages.

A layout can be wrapped around another layout. Just set a `layout` variable in front matter. In this example, the following layout uses the `layouts/main.njk` layout as a wrapper.

```html
---
layout: layouts/main.njk
---

<article>
  <header>
    <h1>{{ title }}</h1>
  </header>

  {{ content | safe }}
</article>
```
