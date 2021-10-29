import { Site } from "../core.ts";
import * as eta from "../deps/eta.ts";
import { EtaConfig } from "../deps/eta.ts";
import loader from "../core/loaders/text.ts";
import { merge } from "../core/utils.ts";
import { Data, Engine, Helper, HelperOptions } from "../core.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /** Custom includes path */
  includes: string;

  /** Configuration to pass to Eta */
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

/** Template engine to render Eta files */
export class EtaEngine implements Engine {
  engine: typeof eta;
  filters: Record<string, Helper> = {};

  constructor(engine: typeof eta) {
    this.engine = engine;
  }

  async render(content: string, data: Data, filename: string) {
    if (!this.engine.templates.get(filename)) {
      this.engine.templates.define(filename, this.engine.compile(content));
    }
    data.filters = this.filters;
    const fn = this.engine.templates.get(filename);
    return await fn(data, this.engine.config);
  }

  addHelper(name: string, fn: Helper, options: HelperOptions) {
    switch (options.type) {
      case "filter":
        this.filters[name] = fn;

        if (options.async) {
          this.engine.configure({ async: true });
        }
        return;
    }
  }
}

/** Register the plugin to use Eta as a template engine */
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
      site.renderer.includes.set(ext, options.includes)
    );

    // Update the cache
    site.addEventListener("beforeUpdate", (ev) => {
      for (const filename of ev.files!) {
        eta.templates.remove(site.src(filename));
      }
    });

    // Load the pages
    site.loadPages(options.extensions, loader, new EtaEngine(eta));
  };
}
