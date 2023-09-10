import json from "../core/loaders/json.ts";
import { merge } from "../core/utils.ts";

import type { Site } from "../core.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /**
   * The list of extensions used to load page files
   * If not set, it will use the same extensions as `extensions`
   */
  pageExtensions?: string[];
}

// Default options
export const defaults: Options = {
  extensions: [".json", ".jsonc"],
  pageExtensions: [".tmpl.json", ".tmpl.jsonc"],
};

/** A plugin to add support for JSON files */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadData(options.extensions, json);
    site.loadPages(options.pageExtensions || options.extensions, json);
  };
}
