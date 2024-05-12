import Prism, { themesPath } from "../deps/prism.ts";
import { merge } from "../core/utils/object.ts";

import type Site from "../core/site.ts";
import type { Page } from "../core/file.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions?: string[];

  /** The css selector to apply prism */
  cssSelector?: string;

  /**
   * The theme or themes to download
   * @see https://cdn.jsdelivr.net/npm/prismjs/themes/
   */
  theme?: Theme | Theme[];
}

interface Theme {
  /** The name of the theme */
  name: string;

  /** The path to the theme file */
  path: string;
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
    site.process(options.extensions, (pages) => pages.forEach(prism));

    if (options.theme) {
      const themes = Array.isArray(options.theme)
        ? options.theme
        : [options.theme];

      for (const { name, path } of themes) {
        site.remoteFile(
          path,
          `${themesPath}prism-${name}.min.css`,
        );
      }
    }

    function prism(page: Page) {
      page.document!.querySelectorAll(options.cssSelector!)
        .forEach((element) => Prism.highlightElement(element));
    }
  };
}
