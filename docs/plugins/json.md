---
title: JSON
---

JSON files are useful to store data not written by humans (for example APIs).

## Creating _data files

Create `_data.json` or `_data/*.json` files to save common variables.

## Creating pages in JSON

It's possible also create pages using JSON format. To do that, create a file with the extension `.tmpl.json` (the `.tmpl` subextension is required to differentiate these pages from other json files that you can include in your site).

```json
{
  "title": "Welcome to my page",
  "layout": "layouts/main.njk",
  "content": "This is my first post using lume,\nI hope you like it!"
}
```
