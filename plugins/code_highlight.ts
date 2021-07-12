import hljs from "../deps/highlight.ts";
import { merge } from "../utils.ts";
import { Page, Site } from "../types.ts";

interface Options {
  extensions: string[];
  options: Partial<HighlightOptions>;
}

interface HighlightOptions {
  ignoreUnescapedHTML: boolean;
  noHighlightRe: RegExp;
  languageDetectRe: RegExp;
  classPrefix: string;
  cssSelector: string;
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

/** Plugin for code syntax highlight using highlight.js library */
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
