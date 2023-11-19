import hljs, { HLJSOptions, LanguageFn } from "../deps/highlight.ts";
import { merge } from "../core/utils/object.ts";
import { log } from "../core/utils/log.ts";

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
  options?: Omit<HLJSOptions, "__emitter">;
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

/** A plugin to syntax-highlight code using the highlight.js library */
export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);
  hljs.configure(options.options);

  if (options.languages) {
    for (const [name, fn] of Object.entries(options.languages)) {
      hljs.registerLanguage(name, fn);
    }
  }

  return (site: Site) => {
    site.process(options.extensions, processCodeHighlight);

    function processCodeHighlight(pages: Page[]) {
      for (const page of pages) {
        page.document!.querySelectorAll<HTMLElement>(
          options.options.cssSelector,
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
