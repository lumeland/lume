import toml from "../core/loaders/toml.ts";
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
  extensions: [".toml"],
};

/** A plugin to add support for TOML files */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadData(options.extensions, toml);
    site.loadPages(
      subExtensions(options.extensions, options.pageSubExtension),
      toml,
    );
  };
}
