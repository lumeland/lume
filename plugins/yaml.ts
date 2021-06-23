import yaml from "../loaders/yaml.ts";
import Site from "../site.ts";
import { merge } from "../utils.ts";
import { UserOptions } from "../types.ts";

type Options = {
  extensions: string[]
}

// Default options
const defaults: Options = {
  extensions: [".yaml", ".yml"],
};

export default function (userOptions: UserOptions<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadData(options.extensions, yaml);
    site.loadPages(options.extensions, yaml);
  };
}
