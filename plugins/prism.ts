import Prism, { themesPath } from "../deps/prism.ts";
import { merge } from "../core/utils/object.ts";
import { readFile } from "../core/utils/read.ts";
import { insertContent } from "../core/utils/page_content.ts";

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

  /** The CSS file to output the font-face rules */
  cssFile?: string;

  /** A placeholder to replace with the generated CSS (only for cssFile) */
  placeholder?: string;
}

// Default options
export const defaults: Options = {
  extensions: [".html"],
  cssSelector: "pre code",
};

/**
 * A plugin to syntax-highlight code using Prism library
 * @see https://lume.land/plugins/prism/
 */
export function prism(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.process(options.extensions, (pages) => pages.forEach(prism));

    if (options.theme) {
      const themes = Array.isArray(options.theme)
        ? options.theme
        : [options.theme];

      for (
        const { name, cssFile = site.options.cssFile, placeholder } of themes
      ) {
        site.process("*", async () => {
          const cssCode = await readFile(getCssUrl(name));
          const page = await site.getOrCreatePage(cssFile);
          insertContent(page, cssCode, placeholder);
        });
      }
    }

    function prism(page: Page) {
      page.document!.querySelectorAll(options.cssSelector!)
        .forEach((element) => Prism.highlightElement(element));
    }
  };
}

export default prism;

function getCssUrl(name: string) {
  if (name === "default") {
    return `${themesPath}prism.min.css`;
  }

  return `${themesPath}prism-${name}.min.css`;
}
