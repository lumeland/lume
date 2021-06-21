import NunjucksEngine from "../engines/nunjucks.js";
import loader from "../loaders/text.js";
import { merge } from "../utils.js";

// Default options
const defaults = {
  extensions: [".njk"],
  options: {},
};

export default function (userOptions) {
  const options = merge(defaults, userOptions);

  return (site) => {
    const nunjucksEngine = new NunjucksEngine(site, options.options);

    const nunjucksExtensions = options.options.extensions ?? {};
    for (const name of Object.keys(nunjucksExtensions)) {
      nunjucksEngine.engine.addExtension(name, nunjucksExtensions[name]);
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
