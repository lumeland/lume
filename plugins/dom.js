import { DOMParser } from "../deps/dom.js";
import { merge } from "../utils.js";

// Default options
const defaults = {
  extensions: [".html"],
  fn() {},
};

export default function (userOptions) {
  const parser = new DOMParser();
  const options = merge(defaults, userOptions);

  return (site) => {
    site.process(options.extensions, processor);

    function processor(page) {
      const document = parser.parseFromString(page.content, "text/html");
      options.fn(document, page);
      page.content = document.documentElement.outerHTML;
    }
  };
}
