import { merge } from "../core/utils/object.ts";

import type Site from "../core/site.ts";
import type { Extensions } from "../core/utils/path.ts";
import type { Page } from "../core/file.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions?: Extensions;

  /**
   * The function to test the page
   * @default `(page) => true`
   */
  fn: (page: Page) => boolean;
}

// Default options
export const defaults: Options = {
  extensions: "*",
  fn: () => true,
};

/** A plugin to filter only some pages */
export default function (userOptions: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.process(options.extensions, (pages, allPages) => {
      for (const page of pages) {
        if (!options.fn(page)) {
          allPages.splice(allPages.indexOf(page), 1);
        }
      }
    });
  };
}
