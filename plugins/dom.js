import { DOMParser } from "../deps/dom.js";
import { merge } from "../utils.js";

// default options
const defaults = {
  extensions: [".html"],
  fn() {},
};

export default function (userOptions) {
  const parser = new DOMParser();
  const options = merge(defaults, userOptions);

  return (site) => {
    site.process(options.extensions, processor);

    async function processor(page) {
      const document = parser.parseFromString(page.content, "text/html");
      options.fn(document, page);
      page.content = document.documentElement.outerHTML;
    }
  };
}
