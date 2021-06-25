import * as pug from "../deps/pug.js";
import Pug from "../engines/pug.js";
import loader from "../loaders/text.js";
import { merge } from "../utils.js";

// Default options
const defaults = {
  extensions: [".pug"],
};

export default function (userOptions) {
  const options = merge(defaults, userOptions);

  return (site) => {
    site.loadPages(options.extensions, loader, new Pug(site, pug));
  };
}
