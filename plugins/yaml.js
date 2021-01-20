import yaml from "../loaders/yaml.js";
import { merge } from "../utils.js";

// default options
const defaults = {
  extensions: [".pug"],
};

export default function (userOptions) {
  const options = merge(defaults, userOptions);

  return (site) => {
    site.loadData(options.extensions, yaml);
    site.loadPages(options.extensions, yaml);
  };
}
