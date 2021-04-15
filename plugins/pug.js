import Pug from "../engines/pug.js";
import { merge } from "../utils.js";

// Default options
const defaults = {
  extensions: [".pug"],
};

export default function (userOptions) {
  const options = merge(defaults, userOptions);

  return (site) => {
    const pug = new Pug(site);

    site.engine(options.extensions, pug);
  };
}
