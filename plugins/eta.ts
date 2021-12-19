import { Site } from "../core.ts";
import * as eta from "../deps/eta.ts";
import loader from "../core/loaders/text.ts";
import { merge } from "../core/utils.ts";

import type { Data, Engine, Helper, HelperOptions } from "../core.ts";
import type { EtaConfig } from "../deps/eta.ts";

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

  deleteCache(file: string): void {
    this.engine.templates.remove(file);
  }

  render(content: string, data: Data, filename: string) {
    if (!this.engine.templates.get(filename)) {
      this.engine.templates.define(filename, this.engine.compile(content));
    }
    data.filters = this.filters;
    const fn = this.engine.templates.get(filename);
    return fn(data, this.engine.config);
  }

  renderSync(content: string, data: Data, filename: string) {
    if (!this.engine.templates.get(filename)) {
      this.engine.templates.define(
        filename,
        this.engine.compile(content, this.engine.getConfig({ async: false })),
      );
    }
    data.filters = this.filters;
    const fn = this.engine.templates.get(filename);
    return fn(data, this.engine.config);
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
    site.includes(options.extensions, options.includes);

    const engine = new EtaEngine(eta);

    // Load the pages
    site.loadPages(options.extensions, loader, engine);

    // Register eta components
    site.loadComponents(options.extensions, loader, engine);
  };
}
