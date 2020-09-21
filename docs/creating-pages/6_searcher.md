---
title: Search object
---

In the layouts, there's a special object named `search` that allows to search other pages and directories. It's useful to build menus or other navigation stuff.

## Searching pages

The function `pages` returns an array of pages. You can filter the pages by tags and directories.

To search by `tags`, just include the tag names as first argument, separated by space. For example, to search all pages containing the tags `post` and `html`, you have to execute `search.pages("post html")`:

```html
<ul>
  {% for post in search.pages("post html") %}
  <li>{{ post.data.title }}</li>
  {% endfor %}
</ul>
```

The second argument is the folder. This allows to return only pages inside a specific directory. By default is "/", but let's say you want to return all pages inside the directory "/docs":

```html
<ul>
  {% for post in search.pages(null, "/docs") %}
  <li>{{ post.data.title }}</li>
  {% endfor %}
</ul>
```

There's a third argument to configure whether all subdirectories must be included or not. By default is `true` but you can disabled, to return only pages inside a directory but not in subdirectories.

```html
<ul>
  {% for post in search.pages(null, "/docs", false) %}
  <li>{{ post.data.title }}</li>
  {% endfor %}
</ul>
```

Note that the pages are sorted by date.

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