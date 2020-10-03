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

In this example, the page returns a generator that create three pages. Every `yield` must return an unique `permalink` (to generate different pages without override each other), and can include other data needed to render the final html. Note also that you can use named exports for those variables that are common to all pages, like the layout.


## `paginate` helper

The `paginate` helper allows to create pages using an array of results. This is useful combined with the `search` helper to create paginated results. For example:

```js
export const layout = "layouts/post-list.njk";

export default function *({ search, paginate }) {
  const posts = search.pages("posts");
  
  for (const page of paginate(posts, { permalink: "posts/page/%d/", size: 10 })) {
    yield page;
  }
}
```

This code use the helpers `search` and `paginate` to create as many pages as needed. First it search all pages tagged as "posts" and then paginate the result creating one page for every 10 posts. As you can see, the `paginate` helper accepts two arguments: an iterable and an object with the options. The available options are:

Name        | Default   | Description
------------|-----------|------------
`size`      | `10`      | Number of elements per page
`permalink` | `page-%d` | The template to generate the permalink of each page. It's uses `sprintf` with the number of page as `%d`.

This helper returns a generator with which that you can iterate. Each item has the following values:

```js
for (const page of paginate(posts, { permalink: "posts/page/%d/", size: 10 })) {
  page.permalink;  //Permalink of the page, for example "post/page/1"
  page.result;     //Array with the results of this page

  //Pagination info:
  page.pagination.page;         //The current page
  page.pagination.totalPages;   //Total pages
  page.pagination.totalResults; //Total results
  page.pagination.previous;     //The url of the previous page
  page.pagination.next;         //The url of the next page

  yield page;
}
```