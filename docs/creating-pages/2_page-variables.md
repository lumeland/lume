---
title: Page variables
---

Pages can contain arbitrary data. In markdown files, the data is defined in the **front matter** block, a block delimited by two triple-dashed lines containing [YAML](https://yaml.org/) code. Let's see an example:

```yaml
---
title: This is the front matter
permalink: custom-url.html
---

# This is the page content
Here you can write markdown content

```

In this example, the frontmatter contains two variables: `title`, that can be used as the page title, and `permalink`, a variable to customize the output file name of the page. Below the front matter you can write the markdown with the page content.

## Standard variables

There are some special variables that **lume** can understand:

- `permalink`: To change the output path of the page
- `date`: By default it's the file creation date but you can override with this variable (or prepending it to the filename). This value is used to sort the pages in a list.
- `layout`: To define the layout that is used to render the page
- `draft`: To ignore pages in production environment, but the page is visible during development.
- `tags`: Tags are used to group pages.

```yaml
---
permalink: /welcome.html
date: 2021-01-01
layout: layouts/post.njk
draft: true
tags: post
---
```
