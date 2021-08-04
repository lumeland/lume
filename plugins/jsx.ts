import JsxEngine from "../core/engines/jsx.ts";
import loader from "../core/loaders/module.ts";
import { merge } from "../core/utils.ts";
import { Site } from "../core.ts";

export interface Options {
  extensions: string[];
}

// Default options
const defaults: Options = {
  extensions: [".jsx", ".tsx"],
};

/** A plugin to add support for JSX and TSX files */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const jsxEngine = new JsxEngine();

    site.loadPages(options.extensions, loader, jsxEngine);
  };
}
