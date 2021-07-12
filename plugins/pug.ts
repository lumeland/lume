import { compile } from "../deps/pug.ts";
import { Site } from "../types.ts";
import Pug, { PugCompiler, PugOptions } from "../engines/pug.ts";
import loader from "../loaders/text.ts";
import { merge } from "../utils.ts";

interface Options {
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

/** Plugin to use Pug as a template engine */
export default function (userOptions?: Partial<Options>) {
  return (site: Site) => {
    const options = merge(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );

    options.options.basedir = site.src(options.includes);

    site.loadPages(
      options.extensions,
      loader,
      new Pug(site, compile as PugCompiler, options.options),
    );
  };
}
