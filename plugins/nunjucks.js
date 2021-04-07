import NunjucksEngine from "../engines/nunjucks.js";
import { merge } from "../utils.js";

// default options
const defaults = {
  extensions: [".njk", ".html"],
};

export default function (userOptions) {
  const options = merge(defaults, userOptions);

  return (site) => {
    const nunjucksEngine = new NunjucksEngine(site);

    site.engine(options.extensions, nunjucksEngine);
    site.filter("njk", filter);

    function filter(string, data = {}) {
      return nunjucksEngine.engine.renderString(string, data);
    }
  };
}
