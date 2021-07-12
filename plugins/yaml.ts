import { Site } from "../core.ts";
import yaml from "../core/loaders/yaml.ts";
import { merge } from "../core/utils.ts";

export interface Options {
  extensions: string[];
}

// Default options
const defaults: Options = {
  extensions: [".yaml", ".yml"],
};

/** This plugin adds support for yaml files */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadData(options.extensions, yaml);
    site.loadPages(options.extensions, yaml);
  };
}
