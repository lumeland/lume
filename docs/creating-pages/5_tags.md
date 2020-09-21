---
title: Tags
---

You can assign one or multiple tags to pages using the `tags` variable. This allows to group content in interesting ways.

For example, in a blog site you may want to group post of different categories:

```yaml
---
title: The history of the static site generators
tags:
  - post
  - static-site-generators
---
```

This post have two tags, one to identify the type of page (post) and other with the topic (static-site-generators). To collect all pages tagged as `post` in the layouts, use the `search` object:

```html
<ul>
  {% for post in search.pages("post") %}
  <li>{{ post.data.title }}</li>
  {% endfor %}
</ul>
```

And to get all pages tagged as `post` and `static-site-generators`:

```html
<ul>
  {% for post in search.pages("post static-site-generators") %}
  <li>{{ post.data.title }}</li>
  {% endfor %}
</ul>
```

## Tags in `_data`

Unlikely other values, when you define `tags` in a `_data.*` file and in the front matter of the pages, the value is not overrided, but aggregated. In other words: the page will have all tags defined in `_data.*` **and** in the front matter. In the previous example, instead assigning the "post" tag to all pages manually, you could define it in a `_data.*` file in the folder where all posts are stored and use the front matter to assign the other tags individually.
