import hljs from "../deps/highlight.ts";
import { merge } from "../core/utils.ts";
import { Page, Site } from "../core.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /** Options passed to highlight.js */
  options: Partial<HighlightOptions>;
}

/** Options of the code highlighter */
export interface HighlightOptions {
  ignoreUnescapedHTML: boolean;

  /** A regex to configure which CSS classes are to be skipped completely. **/
  noHighlightRe: RegExp;

  /** A regex to configure how CSS class names map to language */
  languageDetectRe: RegExp;

  /**
   * A string prefix added before class names in the generated markup,
   * used for backwards compatibility with stylesheets.
   */
  classPrefix: string;

  /** A CSS selector to configure which elements are affected */
  cssSelector: string;

  /** An array of language names and aliases restricting auto detection to only these languages. */
  languages: unknown;
}

// Default options
const defaults = {
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
    site.process([".html"], codeHighlight);

    function codeHighlight(page: Page) {
      page.document!.querySelectorAll(options.options.cssSelector!)
        // @ts-ignore: Property 'highlightElement' does not exist on type '{}'
        .forEach((element) => hljs.highlightElement(element));
    }
  };
}
