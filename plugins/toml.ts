import toml from "../core/loaders/toml.ts";
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
};

/** A plugin to add support for TOML files */
export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadData(options.extensions, toml);
    site.loadPages(options.extensions, {
      loader: toml,
      subExtension: options.pageSubExtension,
    });
  };
}
