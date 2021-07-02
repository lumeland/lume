import Site from "../site.ts";
import yaml from "../loaders/yaml.ts";
import { merge } from "../utils.ts";

interface Options {
  extensions: string[];
}

// Default options
const defaults: Options = {
  extensions: [".yaml", ".yml"],
};

/**
 * This plugin adds support for yaml files
 */
export default function (userOptions: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadData(options.extensions, yaml);
    site.loadPages(options.extensions, yaml);
  };
}
