import { compile } from "../deps/pug.ts";
import { join } from "../deps/path.ts";
import loader from "@lumeland/core/loaders/text.ts";
import { merge } from "@lumeland/core/utils/object.ts";

import type Site from "@lumeland/core/site.ts";
import type { Engine, Helper, HelperOptions } from "@lumeland/core/renderer.ts";
import type { Options as PugOptions } from "../deps/pug.ts";

export interface Options {
  /** File extensions to load */
  extensions?: string[];

  /** Optional sub-extension for page files */
  pageSubExtension?: string;

  /**
   * Options passed to Pug
   * @see https://pugjs.org/api/reference.html#options
   */
  options?: PugOptions;
}

// Default options
export const defaults = {
  extensions: [".pug"],
  options: {},
} satisfies Options;

type Compiler = typeof compile;

/** Template engine to render Pug files */
export class PugEngine implements Engine {
  options: PugOptions;
  compiler: Compiler;
  filters: Record<string, Helper> = {};
  cache = new Map<string, (data?: Record<string, unknown>) => string>();
  basePath: string;

  constructor(compiler: Compiler, basePath: string, options: PugOptions = {}) {
    this.compiler = compiler;
    this.options = options;
    this.basePath = basePath;
  }

  deleteCache(): void {
    this.cache.clear();
  }

  render(content: string, data?: Record<string, unknown>, filename?: string): string {
    const dataWithFilters = {
      ...data,
      filters: {
        ...(data?.filters as Record<string, unknown> | undefined),
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

        const filter: Helper = function (text: string, opt: Record<string, unknown>) {
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

/**
 * A plugin to render Pug templates
 * @see https://lume.land/plugins/pug/
 */
export function pug(userOptions?: Options) {
  return (site: Site) => {
    const options = merge(defaults, userOptions);
    options.options.basedir = site.src("_includes");

    const engine = new PugEngine(compile, site.src(), options.options);

    // Load the pages and register the engine
    site.loadPages(options.extensions, {
      loader,
      engine,
    });

    // Register the pug filter
    site.filter("pug", filter);

    function filter(string: string, data?: Record<string, unknown>): string {
      return engine.render(string, { ...site.scopedData.get("/"), ...data });
    }
  };
}

export default pug;

/** Extends Helpers interface */
declare global {
  namespace Lume {
    export interface Helpers {
      /** @see https://lume.land/plugins/pug/ */
      pug: (string: string, data?: Record<string, unknown>) => string;
    }
  }
}
