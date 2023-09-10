import toml from "../core/loaders/toml.ts";
import { merge } from "../core/utils.ts";

import type { Site } from "../core.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /**
   * The list of extensions used to load page files
   */
  pageExtensions?: string[];
}

// Default options
export const defaults: Options = {
  extensions: [".toml"],
};

/** A plugin to add support for TOML files */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadData(options.extensions, toml);
    site.loadPages(options.pageExtensions || options.extensions, toml);
  };
}
