import { Liquid as Liquidjs, LiquidOptions } from "../deps/liquid.ts";
import loader from "../core/loaders/text.ts";
import { merge } from "../core/utils.ts";
import { Data, Engine, Event, Helper, HelperOptions, Site } from "../core.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /** Custom includes path */
  includes: string;

  /** Options passed to Liquidjs library */
  options: Partial<LiquidOptions>;
}

// Default options
const defaults: Options = {
  extensions: [".liquid"],
  includes: "",
  options: {},
};

/** Template engine to render Liquid files */
export class LiquidEngine implements Engine {
  engine: unknown;
  cache = new Map<string, unknown>();

  constructor(site: Site, engine: unknown) {
    this.engine = engine;

    // Update the internal cache
    site.addEventListener("beforeUpdate", (ev: Event) => {
      for (const file of ev.files!) {
        this.cache.delete(site.src(file));
      }
    });
  }

  async render(content: string, data: Data, filename: string) {
    if (!this.cache.has(filename)) {
      this.cache.set(
        filename,
        // @ts-ignore: No types for Liquid
        this.engine.parse(content, filename),
      );
    }
    const template = this.cache.get(filename)!;
    // @ts-ignore: No types for Liquid
    return await this.engine.render(template, data);
  }

  addHelper(name: string, fn: Helper, options: HelperOptions) {
    switch (options.type) {
      case "filter":
        // @ts-ignore: No types for Liquid
        this.engine.registerFilter(name, fn);
        break;

      case "tag":
        // Tag with body not supported yet
        if (!options.body) {
          // @ts-ignore: No types for Liquid
          this.engine.registerTag(name, createCustomTag(fn));
        }
        break;
    }
  }
}

/** Register the plugin to add support for Liquid files */
export default function (userOptions?: Partial<Options>) {
  return function (site: Site) {
    const options = merge(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );

    const liquidOptions: LiquidOptions = {
      root: site.src(options.includes),
      ...options.options,
    };

    const engine = new Liquidjs(liquidOptions);

    // Load the liquid pages
    site.loadPages(
      options.extensions,
      loader,
      new LiquidEngine(site, engine),
    );

    // Register the liquid filter
    site.filter("liquid", filter as Helper, true);

    function filter(string: string, data = {}) {
      return engine.parseAndRender(string, data);
    }
  };
}

/**
 * Create a custom tag
 * https://liquidjs.com/tutorials/register-filters-tags.html#Register-Tags
 */
function createCustomTag(fn: Helper) {
  return {
    parse(tagToken: unknown) {
      // @ts-ignore: No types for Liquid
      this.str = tagToken.args;
    },

    async render(ctx: unknown): Promise<unknown> {
      // @ts-ignore: No types for Liquid
      const str = await this.liquid.evalValue(this.str, ctx);
      return fn(str);
    },
  };
}
