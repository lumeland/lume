import { Site } from "../core.ts";
import * as eta from "../deps/eta.ts";
import { EtaConfig } from "../deps/eta.ts";
import Eta from "../core/engines/eta.ts";
import loader from "../core/loaders/text.ts";
import { merge } from "../core/utils.ts";

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

/** Plugin to add support for Eta as a template engine */
export default function (userOptions?: Partial<Options>) {
  return (site: Site) => {
    const options = merge(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );

    // Configure eta
    eta.configure({
      ...options.options,
      views: site.src(options.includes),
    });

    // Update cache
    site.addEventListener("beforeUpdate", (ev) => {
      for (const filename of ev.files!) {
        eta.templates.remove(site.src(filename));
      }
    });

    // Load pages
    site.loadPages(options.extensions, loader, new Eta(eta));
  };
}
