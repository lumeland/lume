import { Site } from "../core.ts";
import { merge } from "../core/utils.ts";

/** The options for the paginate helper */
export interface PaginateOptions {
  /** The number of elements per page */
  size: number;

  /** The function to generate the url of the pages */
  url: (page: number) => string;
}

/** The paginate result */
export interface PaginateResult {
  /** The page url */
  url: string;

  /** The page elements */
  results: unknown[];

  /** The pagination info */
  pagination: {
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
  };
}

export interface Options {
  /** The helper name */
  name: string;

  /** The default pagination options */
  options: PaginateOptions;
}

const defaults: Options = {
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
    if (!options.options.url) {
      const ext = site.options.prettyUrls ? "/index.html" : ".html";
      options.options.url = (page: number) => `./page-${page}${ext}`;
    }

    // Register the helper
    site.data(options.name, createPaginator(options.options));
  };
}

/** Create a paginator function */
export function createPaginator(defaults: PaginateOptions) {
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
