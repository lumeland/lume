import hljs from "../deps/highlight.js";
import { merge } from "../utils.js";

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

export default function (userOptions) {
  const options = merge(defaults, userOptions);
  hljs.configure(options.options);

  return (site) => {
    site.process([".html"], codeHighlight);

    function codeHighlight(page) {
      page.document.querySelectorAll(options.options.cssSelector)
        .forEach((element) => hljs.highlightElement(element));
    }
  };
}
