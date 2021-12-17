import { Liquid } from "../deps/liquid.ts";
import loader from "../core/loaders/text.ts";
import { merge } from "../core/utils.ts";

import type {
  Data,
  Engine,
  Event,
  Helper,
  HelperOptions,
  Site,
} from "../core.ts";
import type { LiquidOptions } from "../deps/liquid.ts";

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
  // deno-lint-ignore no-explicit-any
  liquid: any;
  cache = new Map<string, unknown>();

  // deno-lint-ignore no-explicit-any
  constructor(site: Site, liquid: any) {
    this.liquid = liquid;

    // Update the internal cache
    site.addEventListener("beforeUpdate", (ev: Event) => {
      for (const file of ev.files!) {
        this.cache.delete(site.src(file));
      }
    });
  }

  async render(content: string, data?: Data, filename?: string) {
    if (!filename) {
      return this.liquid.parseAndRender(content, data);
    }

    const template = this.getTemplate(content, filename);
    return await this.liquid.render(template, data);
  }

  renderSync(content: string, data?: Data, filename?: string) {
    if (!filename) {
      return this.liquid.parseAndRenderSync(content, data);
    }

    const template = this.getTemplate(content, filename);
    return this.liquid.renderSync(template, data);
  }

  getTemplate(content: string, filename: string) {
    if (!this.cache.has(filename)) {
      this.cache.set(
        filename,
        this.liquid.parse(content, filename),
      );
    }
    return this.cache.get(filename)!;
  }

  addHelper(name: string, fn: Helper, options: HelperOptions) {
    switch (options.type) {
      case "filter":
        this.liquid.registerFilter(name, fn);
        break;

      case "tag":
        // Tag with body not supported yet
        if (!options.body) {
          this.liquid.registerTag(name, createCustomTag(fn));
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

    const engine = new LiquidEngine(site, new Liquid(liquidOptions));

    // Load the liquid pages
    site.loadPages(options.extensions, loader, engine);

    // Register the liquid filter
    site.filter("liquid", filter as Helper, true);

    function filter(string: string, data?: Data) {
      return engine.render(string, { ...site.engines.extraData, ...data });
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
