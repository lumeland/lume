import Pug from "../engines/pug.js";
import loader from "../loaders/text.js";
import { merge } from "../utils.ts";

// Default options
const defaults = {
  extensions: [".pug"],
};

export default function (userOptions) {
  const options = merge(defaults, userOptions);

  return (site) => {
    const pug = new Pug(site);

    site.loadPages(options.extensions, loader, pug);
  };
}
