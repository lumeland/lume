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
  /** The list of extensions this plugin applies to */
  extensions?: string[];

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

  /**
   * The path to the theme file
   * @deprecated Use cssFile instead
   */
  path?: string;

  /** The CSS file to output the font-face rules */
  cssFile?: string;

  /** A placeholder to replace with the generated CSS (only for cssFile) */
  placeholder?: string;
}

// Default options
export const defaults: Options = {
  extensions: [".html"],
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
    site.process(options.extensions, processCodeHighlight);

    if (options.theme) {
      const themes = Array.isArray(options.theme)
        ? options.theme
        : [options.theme];

      for (const { name, path, cssFile, placeholder } of themes) {
        if (cssFile) {
          site.addEventListener("afterRender", async () => {
            const cssCode = await readFile(`${themesPath}${name}.min.css`);
            const page = await site.getOrCreatePage(cssFile);
            insertContent(page, cssCode, placeholder);
          });
          continue;
        }

        if (path) {
          site.remoteFile(path, `${themesPath}${name}.min.css`);
        } else {
          throw new Error(`The theme ${name} must have a path or cssFile`);
        }
      }
    }

    function processCodeHighlight(pages: Page[]) {
      for (const page of pages) {
        page.document!.querySelectorAll<HTMLElement>(
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
