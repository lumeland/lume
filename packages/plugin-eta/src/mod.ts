import { Eta } from "../deps/eta.ts";
import { posix } from "../deps/path.ts";
import loader from "@lumeland/core/loaders/text.ts";
import { merge } from "@lumeland/core/utils/object.ts";

import type Site from "@lumeland/core/site.ts";
import type { Engine, Helper, HelperOptions } from "@lumeland/core/renderer.ts";
import type { EtaConfig } from "../deps/eta.ts";

export interface Options {
  /** File extensions to load */
  extensions?: string[];

  /** Optional sub-extension for page files */
  pageSubExtension?: string;

  /** Configuration to pass to Eta */
  options?: Partial<EtaConfig>;
}

// Default options
export const defaults = {
  extensions: [".eta"],
  options: {
    useWith: true,
  },
} satisfies Options;

/** Template engine to render Eta files */
export class EtaEngine implements Engine {
  engine: Eta;
  filters: Record<string, Helper> = {};
  basePath: string;

  constructor(engine: Eta, basePath: string) {
    this.engine = engine;
    this.basePath = basePath;
  }

  deleteCache(file: string): void {
    const path = posix.join(this.basePath, file);
    this.engine.templatesSync.remove(path);
    this.engine.templatesAsync.remove(path);
  }

  render(content: string, data: Record<string, unknown>, filename: string) {
    const template = this.getTemplate(content, filename, true);

    data.filters = this.filters;
    return this.engine.renderAsync(template, data, { filepath: filename });
  }

  getTemplate(content: string, filename: string, async?: boolean) {
    filename = posix.join(this.basePath, filename);

    const templates = async ? this.engine.templatesAsync : this.engine.templatesSync;
    if (!templates.get(filename)) {
      templates.define(filename, this.engine.compile(content, { async }));
    }
    return templates.get(filename)!;
  }

  addHelper(name: string, fn: Helper, options: HelperOptions) {
    switch (options.type) {
      case "filter":
        this.filters[name] = fn;
        return;
    }
  }
}

/**
 * A plugin to render Eta templates
 * @see https://lume.land/plugins/eta/
 */
export function eta(userOptions?: Options) {
  return (site: Site) => {
    const options = merge(defaults, userOptions);

    // Configure Eta
    const eta = new Eta({
      ...options.options,
      views: site.src("_includes"),
    });

    const engine = new EtaEngine(eta, site.src());

    // Load the pages and register the engine
    site.loadPages(options.extensions, {
      loader,
      engine,
      pageSubExtension: options.pageSubExtension,
    });
  };
}

export default eta;
