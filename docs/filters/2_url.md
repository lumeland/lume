---
title: url
---

The filter `url` normalize absolute paths with the `pathPrefix` value that you have configured in `_config.js`. It's enabled by default and is useful if your site is in a subdirectory.

```html
<a href="{{ page.url | url }}">

<link rel="stylesheet" href="{{ '/css/styles.css' | url }}">
```
