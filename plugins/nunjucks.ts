import nunjucks, { NunjucksOptions } from "../deps/nunjucks.ts";
import loader from "../core/loaders/text.ts";
import { merge } from "../core/utils.ts";
import { Data, Engine, Event, Helper, HelperOptions, Site } from "../core.ts";

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

// Default options
const defaults: Options = {
  extensions: [".njk"],
  includes: "",
  options: {},
  plugins: {},
};

/** Template engine to render Nunjucks files */
export class NunjucksEngine implements Engine {
  // deno-lint-ignore no-explicit-any
  env: any;
  cache = new Map();

  // deno-lint-ignore no-explicit-any
  constructor(site: Site, env: any) {
    this.env = env;

    // Update the internal cache
    site.addEventListener("beforeUpdate", (ev: Event) => {
      for (const file of ev.files!) {
        this.cache.delete(site.src(file));
      }
    });
  }

  render(content: string, data?: Data, filename?: string) {
    if (!filename) {
      return new Promise((resolve, reject) => {
        this.env.renderString(content, data, (err: Error, result: string) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    }

    const template = this.getTemplate(content, filename);

    return new Promise((resolve, reject) => {
      template.render(data, (err: unknown, result: string) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  renderSync(content: string, data?: Data, filename?: string): string {
    if (!filename) {
      return this.env.renderString(content, data);
    }

    const template = this.getTemplate(content, filename);
    return template.render(data);
  }

  getTemplate(content: string, filename: string) {
    if (!this.cache.has(filename)) {
      this.cache.set(
        filename,
        nunjucks.compile(content, this.env, filename),
      );
    }

    return this.cache.get(filename)!;
  }

  addHelper(name: string, fn: Helper, options: HelperOptions) {
    switch (options.type) {
      case "tag": {
        const tag = createCustomTag(name, fn, options);
        this.env.addExtension(name, tag);
        return;
      }

      case "filter":
        if (options.async) {
          const filter = createAsyncFilter(fn);
          this.env.addFilter(name, filter, true);
          return;
        }

        this.env.addFilter(name, fn);
    }
  }
}

/** Register the plugin to use Nunjucks as a template engine */
export default function (userOptions?: Partial<Options>) {
  return (site: Site) => {
    const options = merge(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );

    // Create the nunjucks environment instance
    const fsLoader = new nunjucks.FileSystemLoader(site.src(options.includes));
    const env = new nunjucks.Environment(fsLoader, options.options);

    // Configure includes
    site.renderer.addInclude(options.extensions, options.includes);

    // Register nunjucks extensions
    for (const [name, fn] of Object.entries(options.plugins)) {
      env.addExtension(name, fn);
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

    const engine = new NunjucksEngine(site, env);

    // Load the pages
    site.loadPages(options.extensions, loader, engine);

    // Register the njk filter
    site.filter("njk", filter as Helper, true);

    function filter(string: string, data?: Data) {
      return site.renderer.render(engine, string, data);
    }
  };
}

/**
 * Create an asynchronous filter
 * by to adapting the Promise-based functions to callbacks used by Nunjucks
 * https://mozilla.github.io/nunjucks/api.html#custom-filters
 */
function createAsyncFilter(fn: Helper) {
  return async function (...args: unknown[]) {
    const cb = args.pop() as (err: unknown, result?: unknown) => void;

    try {
      const result = await fn(...args);
      cb(null, result);
    } catch (err) {
      cb(err);
    }
  };
}

/**
 * Create a tag extension
 * https://mozilla.github.io/nunjucks/api.html#custom-tags
 *
 * @param name The tag name
 * @param fn The function to render this tag
 * @param options The options to configure this tag
 */
function createCustomTag(name: string, fn: Helper, options: HelperOptions) {
  const tagExtension = {
    tags: [name],
    // @ts-ignore: There's no types for Nunjucks
    parse(parser, nodes) {
      const token = parser.nextToken();
      const args = parser.parseSignature(null, true);
      parser.advanceAfterBlockEnd(token.value);

      const extraArgs = [];

      if (options.body) {
        const body = parser.parseUntilBlocks(`end${name}`);
        extraArgs.push(body);
        parser.advanceAfterBlockEnd();
      }

      if (options.async) {
        return new nodes.CallExtensionAsync(
          tagExtension,
          "run",
          args,
          extraArgs,
        );
      }

      return new nodes.CallExtension(tagExtension, "run", args, extraArgs);
    },

    // @ts-ignore: There's no types for Nunjucks
    run(_context: unknown, ...args) {
      if (options.body) {
        const [body] = args.splice(
          options.async ? args.length - 2 : args.length - 1,
          1,
        );
        args.unshift(body());
      }

      if (!options.async) {
        const string = fn(...args);
        return new nunjucks.runtime.SafeString(string);
      }

      const callback = args.pop();

      (fn(...args) as Promise<string>).then((string: string) => {
        const result = new nunjucks.runtime.SafeString(string);
        callback(null, result);
      });
    },
  };

  return tagExtension;
}
