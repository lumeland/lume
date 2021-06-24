import JsxEngine from "../engines/jsx.ts";
import loader from "../loaders/module.ts";
import { merge } from "../utils.ts";
import Site from "../site.ts";
import { Optional } from "../types.ts";

interface Options {
  extensions: string[];
}

// Default options
const defaults: Options = {
  extensions: [".jsx", ".tsx"],
};

export default function (userOptions: Optional<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const jsxEngine = new JsxEngine(site);

    site.loadPages(options.extensions, loader, jsxEngine);
  };
}
