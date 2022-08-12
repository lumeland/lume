import { merge } from "../core/utils.ts";

import type { Site } from "../core.ts";

/** The options for the paginate helper */
export interface PaginateOptions {
  /** The number of elements per page */
  size: number;

  /** The function to generate the url of the pages */
  url: (page: number) => string;
}

export type Paginator = <T>(
  results: T[],
  userOptions?: Partial<PaginateOptions>,
) => Generator<PaginateResult<T>, void, unknown>;

/** Pagination info */
export interface PaginationInfo {
  /** The current page number */
  page: number;

  /** The total number of pages */
  totalPages: number;

  /** The total number of elements */
  totalResults: number;

  /** The url of the previous page */
  previous: string | null;

  /** The url of the next page */
  next: string | null;
}

/** The paginate result */
export interface PaginateResult<T> {
  /** The page url */
  url: string;

  /** The elements in this page */
  results: T[];

  /** The pagination info */
  pagination: PaginationInfo;

  [key: string]: unknown;
}

export interface Options {
  /** The helper name */
  name: string;

  /** The default pagination options */
  options: PaginateOptions;
}

export const defaults: Options = {
  name: "paginate",
  options: {
    size: 10,
    url: () => "",
  },
};

/** Register the plugin to enable the `paginate` helper */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    if (!userOptions?.options?.url) {
      const ext = site.options.prettyUrls ? "/index.html" : ".html";
      options.options.url = (page: number) => `./page-${page}${ext}`;
    }

    // Register the helper
    site.data(options.name, createPaginator(options.options));
  };
}

/** Create a paginator function */
export function createPaginator(defaults: PaginateOptions): Paginator {
  return function* paginate<T>(
    results: T[],
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

    function createPageData(page: number): PaginateResult<T> {
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
