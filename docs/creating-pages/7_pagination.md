---
title: Pagination
---

The same source file can generate many output pages. This is useful to paginate elements, for example. To do that, create a javascript page exporting a [generator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators) as default.

```js
//posts.tmpl.js

export const layout = "layouts/page-list.njk";

export default function *(data, filters) {
  const pages = [1, 2, 3];

  for (const page of pages) {
    yield {
      permalink: `page-${page}`,
      content: `This is the page ${page}`
    }
  }
}
```

In this example, the page returns a generator that create three pages. Every `yield` must return an unique `permalink` (to generate different pages without override each other), and can include other data needed to render the final html. Note also that you can use named exports for those variables that are common to all pages.
