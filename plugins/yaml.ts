import { Site } from "../core.ts";
import yaml from "../core/loaders/yaml.ts";
import { merge } from "../core/utils.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];
}

// Default options
const defaults: Options = {
  extensions: [".yaml", ".yml"],
};

/** A plugin to add support for YAML files */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadData(options.extensions, yaml);
    site.loadPages(options.extensions, yaml);
  };
}
