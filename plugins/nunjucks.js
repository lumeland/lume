import NunjucksEngine from "../engines/nunjucks.js";
import { merge } from "../utils.js";

// Default options
const defaults = {
  extensions: [".njk", ".html"],
};

export default function (userOptions) {
  const options = merge(defaults, userOptions);

  return (site) => {
    const nunjucksEngine = new NunjucksEngine(site, userOptions);

    site.engine(options.extensions, nunjucksEngine);
    site.filter("njk", filter, true);

    function filter(string, data = {}) {
      return new Promise((resolve, reject) => {
        nunjucksEngine.engine.renderString(string, data, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    }
  };
}
