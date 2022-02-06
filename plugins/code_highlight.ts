import hljs, { HighlightOptions, LanguageFn } from "../deps/highlight.ts";
import { merge } from "../core/utils.ts";

import type { Page, Site } from "../core.ts";

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
  // @ts-ignore: Property 'configure' does not exist on type '{}'
  hljs.configure(options.options);

  if (userOptions && userOptions.languages) {
    for (const [name, fn] of Object.entries(userOptions.languages)) {
      // @ts-ignore: Property 'registerLanguage' does not exist on type {}
      hljs.registerLangauge(name, fn);
    }
  }

  return (site: Site) => {
    site.process(options.extensions, codeHighlight);

    function codeHighlight(page: Page) {
      page.document!.querySelectorAll(options.options.cssSelector!)
        // @ts-ignore: Property 'highlightElement' does not exist on type '{}'
        .forEach((element) => hljs.highlightElement(element));
    }
  };
}
