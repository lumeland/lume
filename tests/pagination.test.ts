import { assertStrictEquals as equals } from "../deps/assert.ts";
import { createPaginator } from "../plugins/paginate.ts";

Deno.test("pagination plugin function", () => {
  const paginator = createPaginator({
    size: 10,
    url: (num) => `/page/${num}`,
  });

  const all = Array(90).fill(0).map((_, i) => i + 1);
  const pages = paginator(all, {
    each(data) {
      data.title = `Page ${data.pagination.page}`;
    },
  });

  equals(pages.length, 9);
  equals(pages[0].url, "/page/1");
  equals(pages[0].title, "Page 1");
  equals(pages[0].results.length, 10);
  equals(pages[0].results[9], 10);
  equals(pages[0].pagination.page, 1);
  equals(pages[0].pagination.totalPages, 9);
  equals(pages[0].pagination.totalResults, 90);
  equals(pages[0].pagination.previous, null);
  equals(pages[0].pagination.next, "/page/2");
  equals(pages[8].title, "Page 9");
  equals(pages[8].pagination.previous, "/page/8");
  equals(pages[8].pagination.next, null);
});
