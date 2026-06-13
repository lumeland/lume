import tomlLoader from "../core/loaders/toml.ts";
import { merge } from "../core/utils/object.ts";

import type Site from "../core/site.ts";
import { Data } from "../core/file.ts";

export interface Options {
  /** File extensions to load */
  extensions?: string[];

  /** Optional sub-extension for page files */
  pageSubExtension?: string;
}

// Default options
export const defaults = {
  extensions: [".toml"],
  pageSubExtension: ".page",
} satisfies Options;

/**
 * A plugin to load TOML data files and pages
 * @see https://lume.land/plugins/toml/
 */
export function toml(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return <D extends Data>(site: Site<D>) => {
    site.loadData(options.extensions, tomlLoader);
    site.loadPages(options.extensions, {
      loader: tomlLoader,
      pageSubExtension: options.pageSubExtension,
    });
  };
}

export default toml;
