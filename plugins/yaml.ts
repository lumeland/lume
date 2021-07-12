import { Site } from "../types.ts";
import yaml from "../loaders/yaml.ts";
import { merge } from "../utils.ts";

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
