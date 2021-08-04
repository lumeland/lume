import { compile } from "../deps/pug.ts";
import { Site } from "../core.ts";
import Pug, { PugCompiler, PugOptions } from "../core/engines/pug.ts";
import loader from "../core/loaders/text.ts";
import { merge } from "../core/utils.ts";

export interface Options {
  extensions: string[];
  includes: string;
  options: Partial<PugOptions>;
}

// Default options
const defaults: Options = {
  extensions: [".pug"],
  includes: "",
  options: {},
};

/** A plugin to use Pug as a template engine */
export default function (userOptions?: Partial<Options>) {
  return (site: Site) => {
    const options = merge(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );

    // Configure includes
    options.options.basedir = site.src(options.includes);
    options.extensions.forEach((ext) =>
      site.includes.set(ext, options.includes)
    );

    site.loadPages(
      options.extensions,
      loader,
      new Pug(site, compile as PugCompiler, options.options),
    );
  };
}
