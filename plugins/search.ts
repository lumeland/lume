import { merge } from "../core/utils.ts";

import { Data, Page, Searcher, Site } from "../core.ts";

export interface Options {
  /** The helper name */
  name: string;

  /** To return only the `page.data` value */
  returnPageData: boolean;
}

export const defaults: Options = {
  name: "search",
  returnPageData: false,
};

type Query = string | string[];

/** Register the plugin to enable the `search` helpers */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.data(options.name, new Search(site.searcher, options.returnPageData));
    site.filter("data", data);
  };
}

/** Search helper */
export class Search {
  #searcher: Searcher;
  #returnPageData: boolean;

  constructor(searcher: Searcher, returnPageData: boolean) {
    this.#searcher = searcher;
    this.#returnPageData = returnPageData;
  }

  /**
   * Return the data in the scope of a path (file or folder)
   */
  data(path = "/"): Data | undefined {
    return this.#searcher.data(path);
  }

  /** Search pages */
  pages(query?: Query, sort?: Query, limit?: number) {
    const result = this.#searcher.pages(toString(query), toString(sort), limit);

    return this.#returnPageData ? result : result.map((data) => data.page);
  }

  /** Search and return one page */
  page(query?: Query, sort?: Query) {
    return this.pages(query, sort)[0];
  }

  /** Returns all values from the same key of a search */
  values(key: string, query?: Query) {
    return this.#searcher.values(key, toString(query));
  }

  /** Returns all tags values of a search */
  tags(query?: Query) {
    return this.values("tags", query);
  }

  /** Return the next page of a search */
  nextPage(url: string, query?: Query, sort?: Query) {
    const result = this.#searcher.nextPage(
      url,
      toString(query),
      toString(sort),
    );
    return this.#returnPageData ? result : result?.page;
  }

  /** Return the previous page of a search */
  previousPage(url: string, query?: Query, sort?: Query) {
    const result = this.#searcher.previousPage(
      url,
      toString(query),
      toString(sort),
    );
    return this.#returnPageData ? result : result?.page;
  }
}

function data(pages: Page[]): Data[] {
  return pages.map((page) => page.data);
}

function toString(value?: Query): string | undefined {
  return Array.isArray(value) ? value.join(" ") : value;
}
