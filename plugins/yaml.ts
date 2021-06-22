import yaml from "../loaders/yaml.ts";
import { merge } from "../utils.ts";

// Default options
const defaults = {
  extensions: [".yaml", ".yml"],
};

export default function (userOptions) {
  const options = merge(defaults, userOptions);

  return (site) => {
    site.loadData(options.extensions, yaml);
    site.loadPages(options.extensions, yaml);
  };
}
