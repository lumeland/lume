import JsxEngine from "../engines/jsx.ts";
import loader from "../loaders/module.ts";
import { merge } from "../utils.ts";
import Site from "../site.ts";

interface Options {
  extensions: string[];
}

// Default options
const defaults: Options = {
  extensions: [".jsx", ".tsx"],
};

/**
 * Plugin to add support for jsx and tsx files
 */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const jsxEngine = new JsxEngine(site);

    site.loadPages(options.extensions, loader, jsxEngine);
  };
}
