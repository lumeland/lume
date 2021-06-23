import hljs from "../deps/highlight.ts";
import { merge } from "../utils.ts";
import Site from "../site.ts";
import { Page } from "../filesystem.ts";

interface Options {
  extensions: string[],
  options: {
    ignoreUnescapedHTML?: boolean,
    noHighlightRe?: RegExp,
    languageDetectRe?: RegExp,
    classPrefix?: string,
    cssSelector?: string,
    languages?: unknown,
  },
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

export default function (userOptions: Options) {
  const options = merge(defaults, userOptions);
  hljs.configure(options.options);

  return (site: Site) => {
    site.process([".html"], codeHighlight);

    function codeHighlight(page: Page) {
      page.document.querySelectorAll(options.options.cssSelector)
        .forEach((element) => hljs.highlightElement(element));
    }
  };
}
