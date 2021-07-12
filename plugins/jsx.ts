import JsxEngine from "../core/engines/jsx.ts";
import loader from "../core/loaders/module.ts";
import { merge } from "../core/utils.ts";
import { Site } from "../core.ts";

interface Options {
  extensions: string[];
}

// Default options
const defaults: Options = {
  extensions: [".jsx", ".tsx"],
};

/** Plugin to add support for jsx and tsx files */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const jsxEngine = new JsxEngine();

    site.loadPages(options.extensions, loader, jsxEngine);
  };
}
