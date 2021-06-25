import * as eta from "../deps/eta.js";
import Eta from "../engines/eta.js";
import loader from "../loaders/text.js";
import { merge } from "../utils.js";

// Default options
const defaults = {
  extensions: [".eta"],
};

export default function (userOptions) {
  const options = merge(defaults, userOptions);

  return (site) => {
    // Configure eta
    eta.configure({
      views: site.includes(),
      useWith: true,
    });

    // Update cache
    site.addEventListener("beforeUpdate", (ev) => {
      for (const filename of ev.files) {
        eta.templates.remove(site.src(filename));
      }
    });

    // Load pages
    site.loadPages(options.extensions, loader, new Eta(site, eta));
  };
}
