import { merge } from "../core/utils/object.ts";

import type Site from "../core/site.ts";
import type { Page } from "../core/file.ts";

/** The options for the paginate helper */
export interface PaginateOptions {
  /** The number of elements per page */
  size?: number;

  /** The function to generate the url of the pages */
  url?: (page: number) => string;

  /** Function to modify or add extra data to each page */
  each?: (data: PaginateResult<unknown>, page: number) => void;
}

export type Paginator = <T>(
  results: T[],
  userOptions?: Partial<PaginateOptions>,
) => PaginateResult<T>[];

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
  name?: string;

  /** The default pagination options */
  options?: PaginateOptions;
}

export const defaults: Options = {
  name: "paginate",
  options: {
    size: 10,
  },
};

/** Register the plugin to enable the `paginate` helper */
export default function (userOptions?: Options) {
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
  return function paginate<T>(
    results: T[],
    userOptions: Partial<PaginateOptions> = {},
  ) {
    const options = merge(defaults, userOptions);
    const totalResults = results.length;
    const totalPages = Math.ceil(results.length / options.size);

    const result: PaginateResult<T>[] = [];
    let page = 0;

    while (++page <= totalPages) {
      const data = createPageData(page);
      const from = (page - 1) * options.size;
      const to = from + options.size;
      data.results = results.slice(from, to);

      if (options.each) {
        options.each(data, page);
      }

      result.push(data);
    }

    return result;

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

/** Extends PageData interface */
declare global {
  namespace Lume {
    export interface PageData {
      /**
       * The paginator helper
       * @see https://lume.land/plugins/paginate/
       */
      paginate: Paginator;

      /**
       * The pagination info
       * @see https://lume.land/plugins/paginate/
       */
      pagination?: PaginationInfo;

      /**
       * The pagination result
       * @see https://lume.land/plugins/paginate/
       */
      results?: Page[];
    }
  }
}
