import hljs, { HighlightOptions, LanguageFn } from "../deps/highlight.ts";
import { merge } from "../core/utils.ts";

import type { Page, Site } from "../core.ts";
import type { Element } from "../deps/dom.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /** Register languages on the Highlight.js context. */
  languages?: Record<string, LanguageFn>;

  /** Options passed to highlight.js */
  options: Partial<HighlightOptions>;
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
    languages: null,
  },
};

/** A plugin to syntax-highlight code using the highlight.js library */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);
  hljs.configure(options.options);

  if (options.languages) {
    for (const [name, fn] of Object.entries(options.languages)) {
      hljs.registerLanguage(name, fn);
    }
  }

  return (site: Site) => {
    site.process(options.extensions, codeHighlight);

    function codeHighlight(page: Page) {
      page.document!.querySelectorAll(options.options.cssSelector!)
        .forEach((element) => hljs.highlightElement(element as Element));
    }
  };
}
