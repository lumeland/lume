---
title: Yaml
---

[YAML](https://en.wikipedia.org/wiki/YAML) is format to save serialized data. It's **enabled by default** and is useful for pages with multiple pieces of text, like landing pages, guides, directories, etc.

## Creating _data files

This format is useful for shared data, so you can create `_data.yml` or `_data/*.yml` files to save common variables.

## Creating pages in YAML

This format can be used also to create pages, just add a file with `.yml` or `.yaml` extension to your site. For example:

```yaml
title: Welcome to my page
layout: layouts/main.njk
intro: |
  This is my first post using lume
  I hope you like it!

sections:
  - title: Design
    image: img/section1.jpg
    text: I design beautiful and accesible websites

  - title: Development
    image: img/section2.jpg
    text: And can write html and css code!
```

You will need a layout to render this page and generate the html:

```html
<html>
  <head>
    <title>{{ title }}</title>
  </head>
  <body>
    <header>
      <h1>{{ title }}</h1>
      <p>{{ intro }}</p>
    </header>

    {% for section in sections %}
    <section>
      <h2>{{ section.title }}</h2>
      <img src="{{ section.image }}">
      <p>{{ section.text }}</p>
    </section>
    {% endfor %}
  </body>
</html>
```

