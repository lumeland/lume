import { compile, PugOptions } from "../deps/pug.ts";
import loader from "../core/loaders/text.ts";
import { merge } from "../core/utils.ts";
import { Data, Engine, Helper, HelperOptions, Site } from "../core.ts";

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

type PugCompiler = (
  input: string,
  options: Record<string, unknown>,
) => (data: Data) => string;

/** Template engine to render Pug files */
export class PugEngine implements Engine {
  options: PugOptions;
  compiler: PugCompiler;
  cache = new Map<string, (data: Data) => string>();

  constructor(site: Site, compiler: PugCompiler, options: PugOptions) {
    this.compiler = compiler;
    this.options = options;

    // Update the cache
    site.addEventListener("beforeUpdate", () => this.cache.clear());
  }

  render(content: string, data: Data, filename: string) {
    return this.renderSync(content, data, filename);
  }

  renderSync(content: string, data: Data, filename: string) {
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
    site.renderer.addInclude(options.extensions, options.includes);

    // Load the pages
    site.loadPages(
      options.extensions,
      loader,
      new PugEngine(site, compile as PugCompiler, options.options),
    );
  };
}
