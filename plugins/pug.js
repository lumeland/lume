import * as pug from "../deps/pug.ts";
import Pug from "../engines/pug.ts";
import loader from "../loaders/text.js";
import { merge } from "../utils.ts";

// Default options
const defaults = {
  extensions: [".pug"],
  includes: null,
  options: {},
};

export default function (userOptions) {
  return (site) => {
    const options = merge(
      { ...defaults, includes: site.includes() },
      userOptions,
    );

    options.options.basedir = options.includes;

    site.loadPages(
      options.extensions,
      loader,
      new Pug(site, pug, options.options),
    );
  };
}
