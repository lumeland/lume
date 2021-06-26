import * as pug from "../deps/pug.js";
import Pug from "../engines/pug.js";
import loader from "../loaders/text.js";
import { merge } from "../utils.js";

// Default options
const defaults = {
  extensions: [".pug"],
  includes: null,
};

export default function (userOptions) {
  return (site) => {
    const options = merge(
      { ...defaults, includes: site.includes() },
      userOptions,
    );

    site.loadPages(
      options.extensions,
      loader,
      new Pug(site, pug, options.includes),
    );
  };
}
