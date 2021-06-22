import NunjucksEngine from "../engines/nunjucks.ts";
import loader from "../loaders/text.ts";
import { merge } from "../utils.ts";

// Default options
const defaults = {
  extensions: [".njk"],
  options: {},
  plugins: {},
};

export default function (userOptions) {
  const options = merge(defaults, userOptions);

  return (site) => {
    const nunjucksEngine = new NunjucksEngine(site, options.options);

    for (const [name, fn] of Object.entries(options.plugins)) {
      nunjucksEngine.engine.addExtension(name, fn);
    }

    site.loadPages(options.extensions, loader, nunjucksEngine);
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
