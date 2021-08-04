import { Site } from "../core.ts";
import * as eta from "../deps/eta.ts";
import { EtaConfig } from "../deps/eta.ts";
import Eta from "../core/engines/eta.ts";
import loader from "../core/loaders/text.ts";
import { merge } from "../core/utils.ts";

export interface Options {
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

/** A plugin to use Eta as a template engine */
export default function (userOptions?: Partial<Options>) {
  return (site: Site) => {
    const options = merge(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );

    // Configure Eta
    eta.configure({
      ...options.options,
      views: site.src(options.includes),
    });

    // Configure includes
    options.extensions.forEach((ext) =>
      site.includes.set(ext, options.includes)
    );

    // Update the cache
    site.addEventListener("beforeUpdate", (ev) => {
      for (const filename of ev.files!) {
        eta.templates.remove(site.src(filename));
      }
    });

    // Load the pages
    site.loadPages(options.extensions, loader, new Eta(eta));
  };
}
