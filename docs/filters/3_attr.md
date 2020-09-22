---
title: attr
---

The filter `attr` is useful to work with html attributes in your templates.

```html
---
link:
  title: Go to Github
  href: https://github.com
  target: _blank
---

<a {{ link | attr | safe }}>
```

You can also can filter the attributes you want to use:

```html
---
link:
  text: Go to Github
  href: https://github.com
  target: _blank
  noopen: true
  class:
    - link
    - link-external
---

<a {{ link | attr('href', 'target', 'noopen', 'class') | safe }}>
  {{ link.text }}
</a>
```