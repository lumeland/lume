import yamlLoader from "../core/loaders/yaml.ts";
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
  extensions: [".yaml", ".yml"],
};

/**
 * A plugin to load YAML data files and pages
 * Installed by default
 * @see https://lume.land/plugins/yaml/
 */
export function yaml(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadData(options.extensions, yamlLoader);
    site.loadPages(options.extensions, {
      loader: yamlLoader,
      pageSubExtension: options.pageSubExtension,
    });
  };
}
