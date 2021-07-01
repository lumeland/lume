import Site from "../site.ts";
import nunjucks from "../deps/nunjucks.ts";
import NunjucksEngine from "../engines/nunjucks.ts";
import loader from "../loaders/text.ts";
import { merge } from "../utils.ts";
import { Helper } from "../types.ts";

interface Options {
  extensions: string[];
  includes: string;
  options: {
    [index: string]: string;
  };
  plugins: {
    [index: string]: unknown;
  };
}

// Default options
const defaults: Options = {
  extensions: [".njk"],
  includes: "",
  options: {},
  plugins: {},
};

/**
 * This plugin adds support for Nunjucks templates
 */
export default function (userOptions: Partial<Options>) {
  return (site: Site) => {
    const options = merge(
      { ...defaults, includes: site.includes() },
      userOptions,
    );

    // Create the nunjucks environment instance
    const fsLoader = new nunjucks.FileSystemLoader(options.includes);
    const engine = new nunjucks.Environment(fsLoader, options.options);

    for (const [name, fn] of Object.entries(options.plugins)) {
      engine.addExtension(name, fn);
    }

    // Update cache
    site.addEventListener("beforeUpdate", (ev) => {
      for (const file of ev.files!) {
        const filename = site.src(file);
        // @ts-ignore: No index signature with a parameter of type 'string' was found on type '{}'
        const name = fsLoader.pathsToNames[filename];

        if (name) {
          // @ts-ignore: Property 'cache' does not exist on type 'FileSystemLoader'.
          delete fsLoader.cache[name];
          continue;
        }
      }
    });

    site.loadPages(
      options.extensions,
      loader,
      new NunjucksEngine(site, engine),
    );
    site.filter("njk", filter as Helper, true);

    function filter(string: string, data = {}) {
      return new Promise((resolve, reject) => {
        engine.renderString(string, data, (err: Error, result: string) => {
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
