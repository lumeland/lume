import hljs, { HighlightOptions } from "../deps/highlight.ts";
import { merge } from "../core/utils.ts";
import { Page, Site } from "../core.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /** Options passed to highlight.js */
  options: Partial<HighlightOptions>;
}

// Default options
const defaults: Options = {
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

  return (site: Site) => {
    site.process(options.extensions, codeHighlight);

    function codeHighlight(page: Page) {
      page.document!.querySelectorAll(options.options.cssSelector!)
        // @ts-ignore: Property 'highlightElement' does not exist on type '{}'
        .forEach((element) => hljs.highlightElement(element));
    }
  };
}
