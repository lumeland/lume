import { compile } from "../deps/pug.ts";
import { join } from "../deps/path.ts";
import loader from "../core/loaders/text.ts";
import { merge, subExtensions } from "../core/utils.ts";

import type {
  Data,
  DeepPartial,
  Engine,
  Helper,
  HelperOptions,
  Site,
} from "../core.ts";
import type { Options as PugOptions } from "../deps/pug.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /** Optional sub-extension for page files */
  pageSubExtension?: string;

  /**
   * Custom includes path
   * @default `site.options.includes`
   */
  includes: string;

  /**
   * Options passed to Pug
   * @see https://pugjs.org/api/reference.html#options
   */
  options: PugOptions;
}

// Default options
export const defaults: Options = {
  extensions: [".pug"],
  includes: "",
  options: {},
};

type Compiler = typeof compile;

/** Template engine to render Pug files */
export class PugEngine implements Engine {
  options: PugOptions;
  compiler: Compiler;
  filters: Record<string, Helper> = {};
  cache = new Map<string, (data?: Data) => string>();
  basePath: string;
  includes: string;

  constructor(
    compiler: Compiler,
    basePath: string,
    includes: string,
    options: PugOptions = {},
  ) {
    this.compiler = compiler;
    this.options = options;
    this.basePath = basePath;
    this.includes = includes;
  }

  deleteCache(): void {
    this.cache.clear();
  }

  render(content: string, data?: Data, filename?: string): string {
    return this.renderComponent(content, data, filename);
  }

  renderComponent(content: string, data?: Data, filename?: string): string {
    const dataWithFilters = {
      ...data,
      filters: {
        ...data?.filters,
        ...this.filters,
      },
    };

    if (!filename) {
      return this.compiler(content, this.options)(dataWithFilters);
    }
    if (!this.cache.has(filename)) {
      this.cache.set(
        filename,
        this.compiler(content, {
          ...this.options,
          filename: join(this.basePath, filename),
        }),
      );
    }

    return this.cache.get(filename)!(dataWithFilters);
  }

  addHelper(name: string, fn: Helper, options: HelperOptions) {
    switch (options.type) {
      case "filter": {
        this.options.filters ||= {};

        const filter: Helper = (text: string, opt: Record<string, unknown>) => {
          delete opt.filename;
          const args = Object.values(opt);
          return fn(text, ...args);
        };

        this.filters[name] = fn;
        this.options.filters[name] = filter;
        return;
      }
    }
  }
}

/** Register the plugin to use Pug as a template engine */
export default function (userOptions?: DeepPartial<Options>) {
  return (site: Site) => {
    const options = merge(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );
    options.options.basedir = site.src(options.includes);

    const engine = new PugEngine(
      compile,
      site.src(),
      options.includes,
      options.options,
    );

    site.loadPages(
      subExtensions(options.extensions, options.pageSubExtension),
      loader,
      engine,
    );
    site.loadComponents(options.extensions, loader, engine);

    // Register the pug filter
    site.filter("pug", filter as Helper, true);

    function filter(string: string, data?: Data) {
      return engine.render(string, { ...site.scopedData.get("/"), ...data });
    }
  };
}
