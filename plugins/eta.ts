import { Eta } from "../deps/eta.ts";
import { posix } from "../deps/path.ts";
import loader from "../core/loaders/text.ts";
import { merge } from "../core/utils/object.ts";

import type Site from "../core/site.ts";
import type { Engine, Helper, HelperOptions } from "../core/renderer.ts";
import type { EtaConfig } from "../deps/eta.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions?: string[];

  /** Optional sub-extension for page files */
  pageSubExtension?: string;

  /**
   * Custom includes path
   * @default `site.options.includes`
   */
  includes?: string;

  /** Configuration to pass to Eta */
  options?: Partial<EtaConfig>;
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
  engine: Eta;
  filters: Record<string, Helper> = {};
  basePath: string;
  includes: string;

  constructor(engine: Eta, basePath: string, includes: string) {
    this.engine = engine;
    this.basePath = basePath;
    this.includes = includes;
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

  renderComponent(
    content: string,
    data: Record<string, unknown>,
    filename: string,
  ): string {
    const template = this.getTemplate(content, filename, false);

    data.filters = this.filters;
    return this.engine.render(template, data, { filepath: filename });
  }

  getTemplate(content: string, filename: string, async?: boolean) {
    filename = posix.join(this.basePath, filename);

    const templates = async
      ? this.engine.templatesAsync
      : this.engine.templatesSync;
    if (!templates.get(filename)) {
      templates.define(
        filename,
        this.engine.compile(
          content,
          { async },
        ),
      );
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
    const options = merge(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );

    // Configure Eta
    const eta = new Eta({
      ...options.options,
      views: site.src(options.includes),
    });

    const engine = new EtaEngine(eta, site.src(), options.includes);

    // Ignore includes folder
    if (options.includes) {
      site.ignore(options.includes);
    }

    // Load the pages and register the engine
    site.loadPages(options.extensions, {
      loader,
      engine,
      pageSubExtension: options.pageSubExtension,
    });
  };
}

export default eta
