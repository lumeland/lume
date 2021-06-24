import Module from "../engines/module.ts";
import loader from "../loaders/module.ts";
import Site from "../site.ts";
import { merge } from "../utils.ts";
import { Optional } from "../types.ts";

type Options = {
  extensions: {
    data: string[];
    pages: string[];
  };
};

// Default options
const defaults: Options = {
  extensions: {
    data: [".js", ".ts"],
    pages: [".tmpl.js", ".tmpl.ts"],
  },
};

export default function (userOptions: Optional<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadPages(options.extensions.pages, loader, new Module(site));
    site.loadData(options.extensions.data, loader);
  };
}
