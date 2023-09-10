import json from "../core/loaders/json.ts";
import { merge, subExtensions } from "../core/utils.ts";

import type { Site } from "../core.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /** Optional sub-extension for page files */
  pageSubExtension?: string;
}

// Default options
export const defaults: Options = {
  extensions: [".json", ".jsonc"],
  pageSubExtension: ".tmpl",
};

/** A plugin to add support for JSON files */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadData(options.extensions, json);
    site.loadPages(
      subExtensions(options.extensions, options.pageSubExtension),
      json,
    );
  };
}
