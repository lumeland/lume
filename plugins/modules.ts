import { Site } from "../core.ts";
import Module from "../core/engines/module.ts";
import loader from "../core/loaders/module.ts";
import { merge } from "../core/utils.ts";

export interface Options {
  /** The list of extensions used to load data */
  dataExtensions: string[];

  /** The list of extensions used to load pages */
  pagesExtensions: string[];
}

// Default options
const defaults: Options = {
  dataExtensions: [".js", ".ts"],
  pagesExtensions: [".tmpl.js", ".tmpl.ts"],
};

/** A plugin that allows to load JavaScript/TypeScript modules */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadPages(options.pagesExtensions, loader, new Module());
    site.loadData(options.dataExtensions, loader);
  };
}
