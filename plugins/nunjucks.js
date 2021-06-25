import nunjucks from "../deps/nunjucks.js";
import NunjucksEngine from "../engines/nunjucks.js";
import loader from "../loaders/text.js";
import { merge } from "../utils.js";

// Default options
const defaults = {
  extensions: [".njk"],
  options: {},
  plugins: {},
};

export default function (userOptions) {
  const options = merge(defaults, userOptions);

  return (site) => {
    // Create the nunjucks environment instance
    const fsLoader = new nunjucks.FileSystemLoader(site.includes());
    const engine = new nunjucks.Environment(fsLoader, options.options);

    for (const [name, fn] of Object.entries(options.plugins)) {
      engine.addExtension(name, fn);
    }

    // Update cache
    site.addEventListener("beforeUpdate", (ev) => {
      for (const file of ev.files) {
        const filename = site.src(file);
        const name = loader.pathsToNames[filename];

        if (name) {
          delete loader.cache[name];
          continue;
        }
      }
    });

    site.loadPages(
      options.extensions,
      loader,
      new NunjucksEngine(site, engine),
    );
    site.filter("njk", filter, true);

    function filter(string, data = {}) {
      return new Promise((resolve, reject) => {
        engine.renderString(string, data, (err, result) => {
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
