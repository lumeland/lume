---
title: Pagination
---

One source page can generate many output pages, very useful to paginate elements, for example. To do that, create a javascript page exporting [a generator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators).

```js
//posts.tmpl.js

export default function *(data, filters) {
  const pages = [1, 2, 3];

  for (const page of pages) {
    yield {
      permalink: `page-${page}`,
      layout: "layouts/page-list.njk",
      content: `This is the page ${page}`
    }
  }
}
```

In this example, this page returns a generator that create three pages. Every `yield` must return an unique `permalink` (to generate different pages without override each other), and can include a layout and other data needed to render the final html. This is a very flexible way to generate multiple pages, not only for pagination but also for any other need.
