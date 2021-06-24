import Pug from "../engines/pug.ts";
import Site from "../site.ts";
import loader from "../loaders/text.ts";
import { merge } from "../utils.ts";

interface Options {
  extensions: string[];
}

// Default options
const defaults: Options = {
  extensions: [".pug"],
};

export default function (userOptions: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const pug = new Pug(site);

    site.loadPages(options.extensions, loader, pug);
  };
}
