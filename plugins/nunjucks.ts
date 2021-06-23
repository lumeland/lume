import NunjucksEngine from "../engines/nunjucks.ts";
import loader from "../loaders/text.ts";
import { merge } from "../utils.ts";
import Site from "../site.ts";
import { Helper } from "../types.ts";

interface Options {
  extensions?: string[],
  options?: Record<string, unknown>,
  plugins?: Record<string, unknown>,
}

// Default options
const defaults = {
  extensions: [".njk"],
  options: {},
  plugins: {},
};

export default function (userOptions: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const nunjucksEngine = new NunjucksEngine(site, options.options);

    for (const [name, fn] of Object.entries(options.plugins)) {
      nunjucksEngine.engine.addExtension(name, fn);
    }

    site.loadPages(options.extensions, loader, nunjucksEngine);
    site.filter("njk", filter as Helper, true);

    function filter(string: string, data = {}) {
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
