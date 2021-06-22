import Pug from "../engines/pug.ts";
import loader from "../loaders/text.ts";
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
