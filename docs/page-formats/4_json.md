---
title: JSON
---

JSON files can also be used to generate your pages. To do that, create a file with the extension `.tmpl.json`. The `.tmpl` subextension is required to differentiate these pages from other json files that you can include in your site.

```json
{
  "title": "Welcome to my page",
  "layout": "layouts/main.njk",
  "content": "This is my first post using lume,\nI hope you like it!"
}
```
