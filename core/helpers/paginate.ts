import { PaginateOptions, PaginateResult } from "../../core.ts";
import { merge } from "../utils.ts";

/** Helper to paginate a list of results */
export default function (defaults: PaginateOptions) {
  return function* paginate(
    results: unknown[],
    userOptions: Partial<PaginateOptions> = {},
  ) {
    const options = merge(defaults, userOptions);
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
