import { Prism, themePath } from "../deps/prism.ts";
import "../deps/prism.ts";
import { merge } from "@lumeland/core/utils/object.ts";
import { readFile } from "@lumeland/core/utils/read.ts";
import { insertContent } from "@lumeland/core/utils/page_content.ts";
import { log } from "@lumeland/core/utils/log.ts";

import type Site from "@lumeland/core/site.ts";
import type { Page } from "@lumeland/core/file.ts";

export interface Options {
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
export const defaults = {
  cssSelector: "pre code",
} satisfies Options;

/**
 * A plugin to syntax-highlight code using Prism library
 * @see https://lume.land/plugins/prism/
 */
export function prism(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    if (site._data.codeHighlight) {
      log.error(
        `[prism plugin] The plugin "${site._data.codeHighlight}" is already registered for the same purpose as "prism". Registering "prism" may lead to conflicts and unpredictable behavior.`,
      );
    }
    site._data.codeHighlight = "prism";

    site.process([".html"], function processPrism(pages) {
      for (const page of pages) {
        prism(page);
      }
    });

    if (options.theme) {
      const themes = Array.isArray(options.theme) ? options.theme : [options.theme];

      for (const { name, cssFile = site.options.cssFile, placeholder } of themes) {
        site.process(async function processPrismTheme() {
          const cssCode = await readFile(themePath(name));
          const page = await site.getOrCreatePage(cssFile);
          page.text = insertContent(page.text, cssCode, placeholder);
        });
      }
    }

    function prism(page: Page) {
      page.document
        .querySelectorAll(options.cssSelector!)
        .forEach((element) => Prism.highlightElement(element));
    }
  };
}

export default prism;
