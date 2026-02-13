import Prism, { themesPath } from "../deps/prism.ts";
import initAutoload from "../deps/prism-autoload/autoload.ts";
import { merge } from "../core/utils/object.ts";
import { readFile } from "../core/utils/read.ts";
import { insertContent } from "../core/utils/page_content.ts";
import { log } from "../core/utils/log.ts";

import type Site from "../core/site.ts";
import type { Page } from "../core/file.ts";

export interface Options {
  /** The css selector to apply prism */
  cssSelector?: string;

  /**
   * Whether to autoload languages when necessary.
   * If true, the autoloader plugin will be used and it will automatically load the
   * languages used in the page when they are not already loaded.
   */
  autoloadLanguages?: boolean;

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
  cssSelector: "pre code",
  autoloadLanguages: false,
};

/**
 * A plugin to syntax-highlight code using Prism library
 * @see https://lume.land/plugins/prism/
 */
export function prism(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  if (options.autoloadLanguages) {
    initAutoload();
  }

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
      const themes = Array.isArray(options.theme)
        ? options.theme
        : [options.theme];

      for (
        const { name, cssFile = site.options.cssFile, placeholder } of themes
      ) {
        site.process(async function processPrismTheme() {
          const cssCode = await readFile(getCssUrl(name));
          const page = await site.getOrCreatePage(cssFile);
          page.text = insertContent(page.text, cssCode, placeholder);
        });
      }
    }

    function prism(page: Page) {
      page.document.querySelectorAll(options.cssSelector!)
        .forEach((element) => Prism.highlightElement(element));
    }
  };
}

export default prism;

function getCssUrl(name: string) {
  if (name === "default" || name === "prism") {
    return `${themesPath}prism.min.css`;
  }

  return `${themesPath}prism-${name}.min.css`;
}
