---
title: url
---

The filter `url` normalize absolute paths with the `pathPrefix` value that you have configured in `_config.js`. It's enabled by default and is useful if your site is in a subdirectory. It also accepts a boolean argument to generate an absolute url including the host (you must add the `url` option in `_config.js`)

```html
<a href="{{ page.url | url }}">

<!-- Full url -->
<a href="{{ page.url | url(true) }}">

<link rel="stylesheet" href="{{ '/css/styles.css' | url }}">
```
