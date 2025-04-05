import Nunjucks from "../deps/nunjucks.ts";
import loader from "../core/loaders/text.ts";
import { merge } from "../core/utils/object.ts";
import { normalizePath, resolveInclude } from "../core/utils/path.ts";
import { basename, join, posix } from "../deps/path.ts";

import type Site from "../core/site.ts";
import type { Engine, Helper, HelperOptions } from "../core/renderer.ts";
import type { ProxyComponents } from "../core/source.ts";

export interface Options {
  /** File extensions to load */
  extensions?: string[];

  /** Optional sub-extension for page files */
  pageSubExtension?: string;

  /**
   * Custom includes path
   * @default `site.options.includes`
   */
  includes?: string;

  /**
   * Options passed to Nunjucks
   * @see https://mozilla.github.io/nunjucks/api.html#configure
   */
  options?: Nunjucks.ConfigureOptions;

  /** Plugins loaded by Nunjucks */
  plugins?: {
    [index: string]: Nunjucks.Extension;
  };
}

// Default options
export const defaults: Options = {
  extensions: [".njk"],
  options: {},
  plugins: {},
};

/** Template engine to render Nunjucks files */
export class NunjucksEngine implements Engine {
  // deno-lint-ignore no-explicit-any
  env: any;
  cache = new Map();
  basePath: string;
  includes: string;

  // deno-lint-ignore no-explicit-any
  constructor(env: any, basePath: string, includes: string) {
    this.env = env;
    this.basePath = basePath;
    this.includes = includes;
  }

  deleteCache(file: string): void {
    this.cache.delete(file);
    const filename = basename(file);

    // Remove the internal cache of nunjucks
    // deno-lint-ignore no-explicit-any
    this.env.loaders.forEach((fsLoader: any) => {
      Object.keys(fsLoader.cache).forEach((key) => {
        if (key.endsWith(filename)) {
          delete fsLoader.cache[key];
        }
      });
    });
  }

  render(
    content: string,
    data?: Record<string, unknown>,
    filename?: string,
  ): Promise<string> {
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

  getTemplate(content: string, filename: string) {
    if (!this.cache.has(filename)) {
      this.cache.set(
        filename,
        // @ts-ignore: The type definition of nunjucks is wrong
        Nunjucks.compile(content, this.env, join(this.basePath, filename)),
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

        // deno-lint-ignore no-explicit-any
        this.env.addFilter(name, function (this: any, ...args: unknown[]) {
          return fn.apply({ data: this.ctx }, args);
        });
    }
  }
}

class LumeLoader extends Nunjucks.Loader implements Nunjucks.ILoaderAsync {
  includes: string;

  constructor(private site: Site, includes: string) {
    super();
    this.includes = includes;
  }

  async: true = true;

  getSource(
    id: string,
    callback: Nunjucks.Callback<Error, Nunjucks.LoaderSource>,
  ) {
    const rootToRemove = this.site.src();
    let path = normalizePath(id, rootToRemove);

    if (path === normalizePath(id)) {
      path = resolveInclude(id, this.includes, undefined, rootToRemove);
    }

    this.site.getContent(path, false).then((content) => {
      if (content) {
        callback(null, {
          src: content as string,
          path,
          noCache: false,
        });
        return;
      }

      callback(new Error(`Could not load ${path}`), null);
    });
  }

  override resolve(from: string, to: string): string {
    return posix.join(posix.dirname(from), to);
  }
}

/**
 * A plugin to use Nunjucks as a template engine
 * @see https://lume.land/plugins/nunjucks/
 */
export function nunjucks(userOptions?: Options) {
  return (site: Site) => {
    const options = merge(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );

    const env = new Nunjucks.Environment(
      [new LumeLoader(site, options.includes)],
      options.options,
    );

    for (const [name, fn] of Object.entries(options.plugins)) {
      env.addExtension(name, fn);
    }

    site.hooks.addNunjucksPlugin = (name, fn) => {
      env.addExtension(name, fn);
    };

    const engine = new NunjucksEngine(env, site.src(), options.includes);

    // Ignore includes folder
    if (options.includes) {
      site.ignore(options.includes);
    }

    // Load the pages and register the engine
    site.loadPages(options.extensions, {
      loader,
      engine,
      pageSubExtension: options.pageSubExtension,
    });

    // Register the njk filter
    site.filter("njk", filter, true);

    site.filter("await", async (value) => await value, true);

    // Register the component helper
    engine.addHelper("comp", async (...args) => {
      const components = site.source.data.get("/")?.comp as
        | ProxyComponents
        | undefined;
      const [content, name, options = {}] = args;
      delete options.__keywords;
      const props = { content, ...options };

      if (!components) {
        throw new Error(`Component "${name}" not found`);
      }
      const names = name.split(".") as string[];
      let component: ProxyComponents | undefined = components;

      while (names.length) {
        try {
          // @ts-ignore: `component` is defined or throw an error
          component = component[names.shift()];
        } catch {
          throw new Error(`Component "${name}" not found`);
        }
      }

      if (typeof component === "function") {
        return await component(props);
      }

      throw new Error(`Component "${name}" not found`);
    }, {
      type: "tag",
      body: true,
      async: true,
    });

    function filter(
      string: string,
      data?: Record<string, unknown>,
    ): Promise<string> {
      return engine.render(string, { ...site.scopedData.get("/"), ...data });
    }
  };
}

/**
 * Create an asynchronous filter
 * by to adapting the Promise-based functions to callbacks used by Nunjucks
 * https://mozilla.github.io/nunjucks/api.html#custom-filters
 */
function createAsyncFilter(fn: Helper) {
  // deno-lint-ignore no-explicit-any
  return async function (this: any, ...args: unknown[]) {
    const cb = args.pop() as (err: unknown, result?: unknown) => void;

    try {
      const result = await fn.apply({ data: this.ctx }, args);
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

      return new nodes.CallExtensionAsync(
        tagExtension,
        "run",
        args,
        extraArgs,
      );
    },

    // deno-lint-ignore no-explicit-any
    run(context: any, ...args: any[]) {
      const thisArg = { data: context.ctx };
      const callback = args.pop();

      if (options.body) {
        const body = args.pop();

        body(function (e: Error, bodyContent: string) {
          if (e) {
            throw e;
          }

          if (!options.async) {
            const string = fn.apply(thisArg, [bodyContent, ...args]);
            callback(null, new Nunjucks.runtime.SafeString(string));
            return;
          }

          (fn.apply(thisArg, [bodyContent, ...args]) as Promise<string>).then(
            (string: string) => {
              callback(null, new Nunjucks.runtime.SafeString(string));
            },
          );
        });

        return;
      }

      if (!options.async) {
        const string = fn.apply(thisArg, args);
        callback(null, new Nunjucks.runtime.SafeString(string));
        return;
      }

      (fn.apply(thisArg, args) as Promise<string>).then(
        (string: string) => {
          callback(null, new Nunjucks.runtime.SafeString(string));
        },
      );
    },
  };

  return tagExtension;
}

export default nunjucks;

/** Extends Helpers interface */
declare global {
  namespace Lume {
    export interface Helpers {
      /** @see https://lume.land/plugins/nunjucks/ */
      njk: (string: string, data?: Record<string, unknown>) => Promise<string>;
    }
  }
}
