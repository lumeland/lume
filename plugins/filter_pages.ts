import { merge } from "../core/utils/object.ts";

import type Site from "../core/site.ts";
import type { Page } from "../core/file.ts";

export interface Options {
  /**
   * The function to test the page
   * @default `(page) => true`
   */
  fn: (page: Page) => boolean;

  /**
   * Set false to run the filter after the page is rendered
   */
  beforeRender?: boolean;
}

// Default options
export const defaults: Options = {
  fn: () => true,
  beforeRender: false,
};

/**
 * A plugin to filter pages
 * @see https://lume.land/plugins/filter_pages/
 */
export function filterPages(userOptions: Options) {
  const options = merge(defaults, userOptions);
  const processMethod = options.beforeRender ? "preprocess" : "process";

  return (site: Site) => {
    site[processMethod](function processFilterPages(pages, allPages) {
      for (const page of pages) {
        if (!options.fn(page)) {
          allPages.splice(allPages.indexOf(page), 1);
        }
      }
    });
  };
}

export default filterPages;
