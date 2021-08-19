import nunjucks from "../deps/nunjucks.ts";
import NunjucksEngine from "../core/engines/nunjucks.ts";
import loader from "../core/loaders/text.ts";
import { merge } from "../core/utils.ts";
import { Helper, Site } from "../core.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /** Custom includes path */
  includes: string;

  /** Options passed to Nunjucks */
  options: Partial<NunjucksOptions>;

  /** Plugins loaded by Nunjucks */
  plugins: {
    [index: string]: unknown;
  };
}

export interface NunjucksOptions {
  /** Controls if output with dangerous characters are escaped automatically. */
  autoescape: boolean;

  /** Throw errors when outputting a null/undefined value */
  throwOnUndefined: boolean;

  /** Automatically remove trailing newlines from a block/tag */
  trimBlocks: boolean;

  /** Automatically remove leading whitespace from a block/tag */
  lstripBlocks: boolean;
}

// Default options
const defaults: Options = {
  extensions: [".njk"],
  includes: "",
  options: {},
  plugins: {},
};

/** A plugin to use Nunjucks as a template engine */
export default function (userOptions?: Partial<Options>) {
  return (site: Site) => {
    const options = merge(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );

    // Create the nunjucks environment instance
    const fsLoader = new nunjucks.FileSystemLoader(site.src(options.includes));
    const engine = new nunjucks.Environment(fsLoader, options.options);

    // Configure includes
    options.extensions.forEach((ext) =>
      site.includes.set(ext, options.includes)
    );

    for (const [name, fn] of Object.entries(options.plugins)) {
      engine.addExtension(name, fn);
    }

    // Update the cache
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
