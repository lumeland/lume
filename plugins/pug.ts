import { compile } from "../deps/pug.ts";
import loader from "../core/loaders/text.ts";
import { merge } from "../core/utils.ts";

import type { Data, Engine, Helper, HelperOptions, Site } from "../core.ts";
import type { Options as PugOptions } from "../deps/pug.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /** Custom includes path for Pug */
  includes: string;

  /** Options passed to Pug */
  options: Partial<PugOptions>;
}

// Default options
const defaults: Options = {
  extensions: [".pug"],
  includes: "",
  options: {},
};

type Compiler = typeof compile;

/** Template engine to render Pug files */
export class PugEngine implements Engine {
  options: PugOptions;
  compiler: Compiler;
  cache = new Map<string, (data?: Data) => string>();

  constructor(compiler: Compiler, options: PugOptions) {
    this.compiler = compiler;
    this.options = options;
  }

  deleteCache(): void {
    this.cache.clear();
  }

  render(content: string, data?: Data, filename?: string) {
    return this.renderSync(content, data, filename);
  }

  renderSync(content: string, data?: Data, filename?: string) {
    if (!filename) {
      return this.compiler(content, this.options)(data);
    }
    if (!this.cache.has(filename)) {
      this.cache.set(
        filename,
        this.compiler(content, {
          ...this.options,
          filename,
        }),
      );
    }

    return this.cache.get(filename)!(data);
  }

  addHelper(name: string, fn: Helper, options: HelperOptions) {
    switch (options.type) {
      case "filter": {
        this.options.filters ||= {};

        const filter = (text: string, opt: Record<string, unknown>) => {
          delete opt.filename;
          const args = Object.values(opt);
          return fn(text, ...args);
        };

        this.options.filters[name] = filter as Helper;
        return;
      }
    }
  }
}

/** Register the plugin to use Pug as a template engine */
export default function (userOptions?: Partial<Options>) {
  return (site: Site) => {
    const options = merge(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );

    // Configure includes
    options.options.basedir = site.src(options.includes);
    site.includes(options.extensions, options.includes);

    const engine = new PugEngine(compile, options.options);

    // Load the pages
    site.loadPages(options.extensions, loader, engine);

    // Register pug components
    site.loadComponents(options.extensions, loader, engine);

    // Register the pug filter
    site.filter("pug", filter as Helper, true);

    function filter(string: string, data?: Data) {
      return engine.render(string, { ...site.globalData, ...data });
    }
  };
}
