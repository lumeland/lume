import { Liquid as Liquidjs, LiquidOptions } from "../deps/liquid.ts";
import LiquidEngine from "../core/engines/liquid.ts";
import loader from "../core/loaders/text.ts";
import { merge } from "../core/utils.ts";
import { Site } from "../core.ts";

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

/** A plugin to add support for Markdown */
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

    site.loadPages(
      options.extensions,
      loader,
      new LiquidEngine(site, engine),
    );
  };
}
