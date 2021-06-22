import Eta from "../engines/eta.ts";
import loader from "../loaders/text.ts";
import { merge } from "../utils.ts";

// Default options
const defaults = {
  extensions: [".eta"],
};

export default function (userOptions) {
  const options = merge(defaults, userOptions);

  return (site) => {
    const eta = new Eta(site);

    site.loadPages(options.extensions, loader, eta);
  };
}
