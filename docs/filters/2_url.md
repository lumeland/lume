---
title: url
---

The filter `url` normalize absolute paths with the `location` value that you have configured in `_config.js`. It's enabled by default and is useful if your site is in a subdirectory or you want to generate absolute urls.

```html
<a href="{{ page.url | url }}">

<!-- Full url -->
<a href="{{ page.url | url(true) }}">

<link rel="stylesheet" href="{{ '/css/styles.css' | url }}">
```
