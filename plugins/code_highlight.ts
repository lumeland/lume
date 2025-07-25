import hljs, {
  HLJSOptions,
  LanguageFn,
  themesPath,
} from "../deps/highlight.ts";
import { merge } from "../core/utils/object.ts";
import { log } from "../core/utils/log.ts";
import { readFile } from "../core/utils/read.ts";
import { insertContent } from "../core/utils/page_content.ts";

import type Site from "../core/site.ts";
import type { Page } from "../core/file.ts";

export interface Options {
  /** Register languages on the Highlight.js context. */
  languages?: Record<string, LanguageFn>;

  /**
   * Options passed to highlight.js.
   * @see https://highlightjs.readthedocs.io/en/latest/api.html#configure
   */
  options?: Partial<Omit<HLJSOptions, "__emitter">>;

  /**
   * The theme or themes to download
   * @see https://highlightjs.org/examples
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
  options: {
    ignoreUnescapedHTML: false,
    noHighlightRe: /^$/i,
    languageDetectRe: /\blanguage-([\w-]+)\b/i,
    classPrefix: "hljs-",
    cssSelector: "pre code",
    languages: undefined,
  },
};

/**
 * A plugin to syntax-highlight code using the highlight.js library
 * @see https://lume.land/plugins/code_highlight/
 */
export function codeHighlight(userOptions?: Options) {
  const options = merge(defaults, userOptions);
  hljs.configure(options.options);

  if (options.languages) {
    for (const [name, fn] of Object.entries(options.languages)) {
      hljs.registerLanguage(name, fn);
    }
  }

  return (site: Site) => {
    if (site._data.codeHighlight) {
      log.error(
        `[code_highlight plugin] The plugin "${site._data.codeHighlight}" is already registered for the same purpose as "codeHighlight". Registering "codeHighlight" may lead to conflicts and unpredictable behavior.`,
      );
    }
    site._data.codeHighlight = "codeHighlight";

    site.process([".html"], processCodeHighlight);

    if (options.theme) {
      site.process(async function processCodeHighlightTheme() {
        const themes = Array.isArray(options.theme)
          ? options.theme
          : [options.theme];

        for (
          const { name, cssFile = site.options.cssFile, placeholder } of themes
        ) {
          const cssCode = await readFile(`${themesPath}${name}.min.css`);
          const page = await site.getOrCreatePage(cssFile);
          page.text = insertContent(page.text, cssCode, placeholder);
        }
      });
    }

    function processCodeHighlight(pages: Page[]) {
      for (const page of pages) {
        page.document.querySelectorAll<HTMLElement>(
          options.options.cssSelector!,
        )
          .forEach((element) => {
            try {
              hljs.highlightElement(element);
              element.removeAttribute("data-highlighted");
            } catch (error) {
              log.error(
                `Error highlighting code block in ${page.sourcePath}: ${error}`,
              );
            }
          });
      }
    }
  };
}

export default codeHighlight;
