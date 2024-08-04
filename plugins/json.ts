import json from "../core/loaders/json.ts";
import { merge } from "../core/utils/object.ts";

import type Site from "../core/site.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions?: string[];

  /** Optional sub-extension for page files */
  pageSubExtension?: string;
}

// Default options
export const defaults: Options = {
  extensions: [".json", ".jsonc"],
  pageSubExtension: ".page",
};

/**
 * A plugin to load JSON files as data and pages
 * Installed by default
 * @see https://lume.land/plugins/json/
 */
export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadData(options.extensions, json);
    site.loadPages(options.extensions, {
      pageSubExtension: options.pageSubExtension,
      loader: json,
    });
  };
}
