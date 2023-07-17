import toml from "../core/loaders/toml.ts";
import { merge } from "../core/utils.ts";

import type { Site } from "../core.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[] | {
    pages: string[];
    data: string[];
  };
}

// Default options
export const defaults: Options = {
  extensions: [".toml"],
};

/** A plugin to add support for TOML files */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);
  const extensions = Array.isArray(options.extensions)
    ? { pages: options.extensions, data: options.extensions }
    : options.extensions;

  return (site: Site) => {
    site.loadData(extensions.data, toml);
    site.loadPages(extensions.pages, toml);
  };
}
