import { merge } from "../core/utils.ts";

import type { Extensions, Page, Site } from "../core.ts";

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
    site.process(options.extensions, (page: Page) => {
      if (!options.fn(page)) {
        return false;
      }
    });
  };
}
