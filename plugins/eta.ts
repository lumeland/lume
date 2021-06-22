import Eta from "../engines/eta.js";
import loader from "../loaders/text.js";
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
