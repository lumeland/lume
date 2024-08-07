import tomlLoader from "../core/loaders/toml.ts";
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
  extensions: [".toml"],
  pageSubExtension: ".page",
};

/**
 * A plugin to load TOML data files and pages
 * @see https://lume.land/plugins/toml/
 */
export function toml(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadData(options.extensions, tomlLoader);
    site.loadPages(options.extensions, {
      loader: tomlLoader,
      pageSubExtension: options.pageSubExtension,
    });
  };
}
