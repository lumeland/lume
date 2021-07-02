import Site from "../site.ts";
import * as eta from "../deps/eta.ts";
import Eta from "../engines/eta.ts";
import loader from "../loaders/text.ts";
import { merge } from "../utils.ts";

interface Options {
  extensions: string[];
  includes: string;
}

// Default options
const defaults: Options = {
  extensions: [".eta"],
  includes: "",
};

/**
 * Plugin to add support for Eta as a template engine
 */
export default function (userOptions: Partial<Options>) {
  return (site: Site) => {
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
      for (const filename of ev.files!) {
        eta.templates.remove(site.src(filename));
      }
    });

    // Load pages
    site.loadPages(options.extensions, loader, new Eta(site, eta));
  };
}
