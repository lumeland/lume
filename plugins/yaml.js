import yaml from "../loaders/yaml.js";
import { merge } from "../utils.js";

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
