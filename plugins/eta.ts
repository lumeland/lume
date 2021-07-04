import Site from "../site.ts";
import * as eta from "../deps/eta.ts";
import { EtaConfig } from "../deps/eta.ts";
import Eta from "../engines/eta.ts";
import loader from "../loaders/text.ts";
import { merge } from "../utils.ts";

interface Options {
  extensions: string[];
  includes: string;
  options: Partial<EtaConfig>;
}

// Default options
const defaults: Options = {
  extensions: [".eta"],
  includes: "",
  options: {
    useWith: true,
  },
};

/**
 * Plugin to add support for Eta as a template engine
 */
export default function (userOptions?: Partial<Options>) {
  return (site: Site) => {
    const options = merge(
      { ...defaults, includes: site.includes() },
      userOptions,
    );

    // Configure eta
    eta.configure({
      ...options.options,
      views: options.includes,
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
