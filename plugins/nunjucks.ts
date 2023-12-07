import nunjucks from "../deps/nunjucks.ts";
import loader from "../core/loaders/text.ts";
import { merge } from "../core/utils/object.ts";
import { normalizePath, resolveInclude } from "../core/utils/path.ts";
import { basename, join, posix } from "../deps/path.ts";

import type Site from "../core/site.ts";
import type { Engine, Helper, HelperOptions } from "../core/renderer.ts";
import type { ProxyComponents } from "../core/source.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
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
  options?: nunjucks.ConfigureOptions;

  /** Plugins loaded by Nunjucks */
  plugins?: {
    [index: string]: nunjucks.Extension;
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

  renderComponent(
    content: string,
    data?: Record<string, unknown>,
    filename?: string,
  ): string {
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
        // @ts-ignore: The type definition of nunjucks is wrong
        nunjucks.compile(content, this.env, join(this.basePath, filename)),
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

class LumeLoader extends nunjucks.Loader implements nunjucks.ILoaderAsync {
  includes: string;

  constructor(private site: Site, includes: string) {
    super();
    this.includes = includes;
  }

  async: true = true;

  getSource(
    id: string,
    callback: nunjucks.Callback<Error, nunjucks.LoaderSource>,
  ) {
    const rootToRemove = this.site.src();
    let path = normalizePath(id, rootToRemove);

    if (path === normalizePath(id)) {
      path = resolveInclude(id, this.includes, undefined, rootToRemove);
    }

    this.site.getContent(path, loader).then((content) => {
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

  resolve(from: string, to: string): string {
    return posix.join(posix.dirname(from), to);
  }
}

/** Register the plugin to use Nunjucks as a template engine */
export default function (userOptions?: Options) {
  return (site: Site) => {
    const options = merge(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );

    const env = new nunjucks.Environment(
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

    // Register the component helper
    engine.addHelper("comp", (...args) => {
      const components = site.source.data.get("/")
        ?.[site.options.components.variable] as
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
        return component(props);
      }

      throw new Error(`Component "${name}" not found`);
    }, {
      type: "tag",
      body: true,
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

/** Extends Helpers interface */
declare global {
  namespace Lume {
    export interface Helpers {
      /** @see https://lume.land/plugins/nunjucks/ */
      njk: (string: string, data?: Record<string, unknown>) => Promise<string>;
    }
  }
}
