import { Liquid, Tag, toPromise, Value } from "../deps/liquid.ts";
import { posix } from "../deps/path.ts";
import loader from "../core/loaders/text.ts";
import { merge } from "../core/utils.ts";

import type {
  Data,
  DeepPartial,
  Engine,
  Helper,
  HelperOptions,
  Site,
} from "../core.ts";
import type {
  Context,
  Emitter,
  LiquidOptions,
  TagToken,
  Template,
  TopLevelToken,
} from "../deps/liquid.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[] | {
    pages: string[];
    components: string[];
  };

  /** Custom includes path */
  includes: string;

  /** Options passed to Liquidjs library */
  options: LiquidOptions;
}

// Default options
export const defaults: Options = {
  extensions: [".liquid"],
  includes: "",
  options: {},
};

/** Template engine to render Liquid files */
export class LiquidEngine implements Engine {
  liquid: Liquid;
  cache = new Map<string, Template[]>();
  basePath: string;

  constructor(liquid: Liquid, basePath: string) {
    this.liquid = liquid;
    this.basePath = basePath;
  }

  deleteCache(file: string): void {
    this.cache.delete(file);
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

  getTemplate(content: string, filename: string): Template[] {
    if (!this.cache.has(filename)) {
      this.cache.set(
        filename,
        this.liquid.parse(content, posix.join(this.basePath, filename)),
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
export default function (userOptions?: DeepPartial<Options>) {
  return function (site: Site) {
    const options = merge(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );

    const extensions = Array.isArray(options.extensions)
      ? {
        pages: options.extensions,
        includes: options.extensions,
        components: options.extensions,
      }
      : options.extensions;

    const liquidOptions: LiquidOptions = {
      root: site.src(options.includes),
      ...options.options,
    };

    const engine = new LiquidEngine(new Liquid(liquidOptions), site.src());

    site.loadPages(extensions.pages, loader, engine);
    site.includes(extensions.pages, options.includes);
    site.includes(extensions.components, options.includes);
    site.loadComponents(extensions.components, loader, engine);

    // Register the liquid filter
    site.filter("liquid", filter as Helper, true);

    function filter(string: string, data?: Data) {
      return engine.render(string, { ...site.scopedData.get("/"), ...data });
    }
  };
}

/**
 * Create a custom tag
 * https://liquidjs.com/tutorials/register-filters-tags.html#Register-Tags
 */
function createCustomTag(fn: Helper): Tag {
  return class extends Tag {
    #value: Value;

    constructor(
      token: TagToken,
      remainTokens: TopLevelToken[],
      liquid: Liquid,
    ) {
      super(token, remainTokens, liquid);
      this.#value = new Value(token.args, liquid);
    }

    async render(ctx: Context, emitter: Emitter) {
      const str = await toPromise(this.#value.value(ctx, false));
      emitter.write(await fn(str));
    }
  };
}
