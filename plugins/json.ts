import jsonLoader from "../core/loaders/json.ts";
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
  extensions: [".json", ".jsonc"],
  pageSubExtension: ".page",
} satisfies Options;

/**
 * A plugin to load JSON files as data and pages
 * Installed by default
 * @see https://lume.land/plugins/json/
 */
export function json(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return <D extends Data>(site: Site<D>) => {
    site.loadData(options.extensions, jsonLoader);
    site.loadPages(options.extensions, {
      pageSubExtension: options.pageSubExtension,
      loader: jsonLoader,
    });
  };
}

export default json;
