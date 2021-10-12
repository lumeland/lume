import {
  Context,
  Liquid as Liquidjs,
  LiquidOptions,
  TagImplOptions,
  TagToken,
  Template,
} from "../deps/liquid.ts";
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
  engine: Liquidjs;
  cache: Map<string, Template[]> = new Map();

  constructor(site: Site, engine: Liquidjs) {
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
        this.engine.parse(content, filename),
      );
    }
    const template = this.cache.get(filename)!;
    return await this.engine.render(template, data);
  }

  addHelper(name: string, fn: Helper, options: HelperOptions) {
    switch (options.type) {
      case "filter":
        this.engine.registerFilter(name, fn);
        break;

      case "tag":
        // Tag with body not supported yet
        if (!options.body) {
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
      root: options.includes,
      ...options.options,
    };

    const engine = new Liquidjs(liquidOptions);

    // Load the liquid pages
    site.loadPages(
      options.extensions,
      loader,
      new LiquidEngine(site, engine),
    );
  };
}

/**
 * Create a custom tag
 * https://liquidjs.com/tutorials/register-filters-tags.html#Register-Tags
 */
function createCustomTag(fn: Helper): TagImplOptions {
  return {
    parse(tagToken: TagToken) {
      this.str = tagToken.args;
    },

    async render(ctx: Context) {
      const str = await this.liquid.evalValue(this.str, ctx);
      return fn(str);
    },
  };
}
