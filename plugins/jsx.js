import JsxEngine from "../engines/jsx.ts";
import loader from "../loaders/module.js";
import { merge } from "../utils.js";

// Default options
const defaults = {
  extensions: [".jsx", ".tsx"],
};

export default function (userOptions) {
  const options = merge(defaults, userOptions);

  return (site) => {
    const jsxEngine = new JsxEngine(site);

    site.loadPages(options.extensions, loader, jsxEngine);
  };
}
