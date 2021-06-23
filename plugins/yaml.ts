import yaml from "../loaders/yaml.ts";
import { merge } from "../utils.ts";
import Site from "../site.ts";

interface Options {
  extensions: string[]
}

// Default options
const defaults = {
  extensions: [".yaml", ".yml"],
};

export default function (userOptions: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadData(options.extensions, yaml);
    site.loadPages(options.extensions, yaml);
  };
}
