import JsxEngine from "../engines/jsx.js";
import { merge } from "../utils.js";

// Default options
const defaults = {
  extensions: [".jsx", ".tsx"],
};

export default function (userOptions) {
  const options = merge(defaults, userOptions);

  return (site) => {
    const jsxEngine = new JsxEngine(site);

    site.engine(options.extensions, jsxEngine);
  };
}
