import Prism from "../deps/prism.ts";
import { merge } from "../core/utils.ts";

import type { Page, Site } from "../core.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions?: string[];

  /** The css selector to apply prism */
  cssSelector?: string;
}

// Default options
export const defaults: Options = {
  extensions: [".html"],
  cssSelector: "pre code",
};

/** A plugin to syntax-highlight code using the prism library */
export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.process(options.extensions, prism);

    function prism(page: Page) {
      page.document!.querySelectorAll(options.cssSelector!)
        .forEach((element) => Prism.highlightElement(element));
    }
  };
}
