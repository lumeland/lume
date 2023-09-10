import yaml from "../core/loaders/yaml.ts";
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
  extensions: [".yaml", ".yml"],
};

/** A plugin to add support for YAML files */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);
  const extensions = Array.isArray(options.extensions)
    ? { pages: options.extensions, data: options.extensions }
    : options.extensions;

  return (site: Site) => {
    site.loadData(extensions.data, yaml);
    site.loadPages(extensions.pages, { loader: yaml });
  };
}
