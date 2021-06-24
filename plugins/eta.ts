import Eta from "../engines/eta.ts";
import loader from "../loaders/text.ts";
import { merge } from "../utils.ts";
import Site from "../site.ts";

interface Options {
  extensions: string[];
}

// Default options
const defaults: Options = {
  extensions: [".eta"],
};

export default function (userOptions: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const eta = new Eta(site);

    site.loadPages(options.extensions, loader, eta);
  };
}
