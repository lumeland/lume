import * as eta from "../deps/eta.ts";
import Eta from "../engines/eta.ts";
import loader from "../loaders/text.js";
import { merge } from "../utils.js";

// Default options
const defaults = {
  extensions: [".eta"],
  includes: null,
};

export default function (userOptions) {
  return (site) => {
    const options = merge(
      { ...defaults, includes: site.includes() },
      userOptions,
    );

    // Configure eta
    eta.configure({
      views: options.includes,
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
