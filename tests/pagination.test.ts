import { assertStrictEquals as equals } from "../deps/assert.ts";
import paginate from "../core/helpers/paginate.ts";

Deno.test("pagination plugin function", () => {
  const paginator = paginate({
    size: 10,
    url: (num) => `/page/${num}`,
  });

  const all = Array(90).fill(0).map((_, i) => i + 1);
  const pages = [...paginator(all)];

  equals(pages.length, 9);
  equals(pages[0].url, "/page/1");
  equals(pages[0].results.length, 10);
  equals(pages[0].results[9], 10);
  equals(pages[0].pagination.page, 1);
  equals(pages[0].pagination.totalPages, 9);
  equals(pages[0].pagination.totalResults, 90);
  equals(pages[0].pagination.previous, null);
  equals(pages[0].pagination.next, "/page/2");
  equals(pages[8].pagination.previous, "/page/8");
  equals(pages[8].pagination.next, null);
});
