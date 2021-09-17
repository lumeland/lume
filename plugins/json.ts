import { Site } from "../core.ts";
import json from "../core/loaders/json.ts";
import { merge } from "../core/utils.ts";

export interface Options {
  /** The list of extensions used to load data */
  dataExtensions: string[];

  /** The list of extensions used to load pages */
  pagesExtensions: string[];
}

// Default options
const defaults: Options = {
  dataExtensions: [".json"],
  pagesExtensions: [".tmpl.json"],
};

/** A plugin to add support for JSON files */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadData(options.dataExtensions, json);
    site.loadPages(options.pagesExtensions, json);
  };
}
