import yaml from "../core/loaders/yaml.ts";
import { merge } from "../core/utils.ts";

import type { Site } from "../core.ts";

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

/** A plugin to add support for YAML files */
export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadData(options.extensions, yaml);
    site.loadPages(options.extensions, {
      loader: yaml,
      subExtension: options.pageSubExtension,
    });
  };
}
