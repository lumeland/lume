import loader from "../core/loaders/module.ts";
import { merge } from "../core/utils/object.ts";

import type Site from "../core/site.ts";
import type { Engine, Helper } from "../core/renderer.ts";

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
}

// Default options
export const defaults: Options = {
  extensions: [".js", ".ts"],
  pageSubExtension: ".page",
};

/** Template engine to render js/ts files */
export class ModuleEngine implements Engine {
  helpers: Record<string, Helper> = {};
  includes: string;

  constructor(includes: string) {
    this.includes = includes;
  }

  deleteCache() {}

  async render(
    content: unknown,
    data: Record<string, unknown>,
  ): Promise<unknown> {
    return typeof content === "function"
      ? await content(data, this.helpers)
      : content;
  }

  addHelper(name: string, fn: Helper) {
    this.helpers[name] = fn;
  }
}

/**
 * A plugin to load js/ts files as data and pages
 * Installed by default
 * @see https://lume.land/plugins/modules/
 */
export function modules(userOptions?: Options) {
  return (site: Site) => {
    const options = merge(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );

    const engine = new ModuleEngine(options.includes);

    // Ignore includes folder
    if (options.includes) {
      site.ignore(options.includes);
    }

    // Load the _data files
    site.loadData(options.extensions, loader);

    // Load the pages and register the engine
    site.loadPages(options.extensions, {
      loader,
      engine,
      pageSubExtension: options.pageSubExtension,
    });
  };
}

export default modules;
