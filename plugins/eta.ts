import { Site } from "../core.ts";
import * as eta from "../deps/eta.ts";
import { join } from "../deps/path.ts";
import loader from "../core/loaders/text.ts";
import { merge } from "../core/utils.ts";

import type { Data, Engine, Helper, HelperOptions } from "../core.ts";
import type { EtaConfig } from "../deps/eta.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[] | {
    pages: string[];
    components: string[];
  };

  /** Custom includes path */
  includes: string;

  /** Configuration to pass to Eta */
  options: Partial<EtaConfig>;
}

// Default options
export const defaults: Options = {
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
  basePath: string;

  constructor(engine: typeof eta, basePath: string) {
    this.engine = engine;
    this.basePath = basePath;
  }

  deleteCache(file: string): void {
    this.engine.templates.remove(join(this.basePath, file));
  }

  render(content: string, data: Data, filename: string) {
    const template = this.getTemplate(content, filename);

    data.filters = this.filters;
    return template(data, this.engine.config);
  }

  renderSync(content: string, data: Data, filename: string) {
    const template = this.getTemplate(content, filename, { async: false });

    data.filters = this.filters;
    return template(data, this.engine.config);
  }

  getTemplate(content: string, filename: string, options?: Partial<EtaConfig>) {
    filename = join(this.basePath, filename);

    if (!this.engine.templates.get(filename)) {
      this.engine.templates.define(
        filename,
        this.engine.compile(
          content,
          this.engine.getConfig({ filename, ...options }),
        ),
      );
    }
    return this.engine.templates.get(filename)!;
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
      views: [
        site.src(options.includes),
        site.src(),
      ],
    });

    const extensions = Array.isArray(options.extensions)
      ? { pages: options.extensions, components: options.extensions }
      : options.extensions;

    const engine = new EtaEngine(eta, site.src());

    site.loadPages(extensions.pages, loader, engine);
    site.includes(extensions.pages, options.includes);
    site.includes(extensions.components, options.includes);
    site.loadComponents(extensions.components, loader, engine);
  };
}
