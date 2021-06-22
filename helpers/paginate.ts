import Site from "../site.ts";
import { PaginateOptions, PaginateResult } from "../types.ts";

export default function (site: Site) {
  const ext = site.options.prettyUrls ? "/index.html" : ".html";

  const defaults = {
    size: 10,
    url: (page: number) => `./page-${page}${ext}`,
  };

  return function* paginate(results: unknown[], options?: PaginateOptions) {
    options = { ...defaults, ...options };

    const totalResults = results.length;
    const totalPages = Math.ceil(results.length / options.size);
    let page = 1;
    let data = createPageData(page);

    for (const result of results) {
      data.results.push(result);

      if (data.results.length >= options.size) {
        yield data;

        data = createPageData(++page);
      }
    }

    if (data.results.length) {
      yield data;
    }

    function createPageData(page: number): PaginateResult {
      return {
        url: options.url(page),
        results: [],
        pagination: {
          page,
          totalPages,
          totalResults,
          previous: page > 1 ? options.url(page - 1) : null,
          next: totalPages > page ? options.url(page + 1) : null,
        },
      };
    }
  };
}
