import { merge } from "../core/utils/object.ts";

import type Site from "../core/site.ts";
import type { Page } from "../core/file.ts";

export interface Options {
  /**
   * The function to test the page
   * @default `(page) => true`
   */
  fn: (page: Page) => boolean;
}

// Default options
export const defaults: Options = {
  fn: () => true,
};

/**
 * A plugin to filter pages
 * @see https://lume.land/plugins/filter_pages/
 */
export function filterPages(userOptions: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.process(function processFilterPages(pages, allPages) {
      for (const page of pages) {
        if (!options.fn(page)) {
          allPages.splice(allPages.indexOf(page), 1);
        }
      }
    });
  };
}

export default filterPages;
