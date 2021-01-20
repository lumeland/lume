import Markdown from "../engines/markdown.js";
import { merge } from "../utils.js";

// default options
const defaults = {
  extensions: [".md", ".markdown"],
};

export default function (userOptions) {
  const options = merge(defaults, userOptions);

  return function (site) {
    const markdown = new Markdown(site);

    site.engine(options.extensions, markdown);
    site.filter("md", filter);

    function filter(string, inline = false) {
      return inline
        ? markdown.engine.renderInline(string || "").trim()
        : markdown.engine.render(string || "").trim();
    }
  };
}
