---
title: Search and collecting
---

In the layouts, there's a special object named `search` that allows to search other pages and directories. It's useful to build menus or other navigation stuff.

## Searching pages

The function `search.pages()` returns an array of pages that you can filter by tags and sort.

To search by tags, just include the tag names as first argument, separated by space. For example, to search all pages containing the tags `post` and `html`, you have to execute `search.pages("post html")`:

```html
<ul>
  {% for post in search.pages("post html") %}
  <li>{{ post.data.title }}</li>
  {% endfor %}
</ul>
```

The second argument is the sort. The available options are:

- `date`: The default value. Sort the pages by date
- `file`: Sort the pages by filename

```html
<ul>
  {% for post in search.pages("post html", "file") %}
  <li>{{ post.data.title }}</li>
  {% endfor %}
</ul>
```

## Searching folders

The function `folder` returns an object representing a folder. This is useful to get the data associated to a that folder (stored in `_data`). For example:

```html
<strong>{{ search.folder("/about").data.sectionTitle }}</strong>

<ul>
  {% for post in search.pages(null, "/about", false) %}
  <li>{{ post.data.title }}</li>
  {% endfor %}
</ul>
```