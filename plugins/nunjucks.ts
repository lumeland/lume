import nunjucks from "../deps/nunjucks.ts";
import loader from "../core/loaders/text.ts";
import { merge, normalizePath, resolveInclude } from "../core/utils.ts";
import { Exception } from "../core/errors.ts";
import { basename, join, posix } from "../deps/path.ts";

import type {
  ComponentFunction,
  Data,
  DeepPartial,
  Engine,
  Helper,
  HelperOptions,
  ProxyComponents,
  Site,
} from "../core.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[] | {
    pages: string[];
    components: string[];
  };

  /** Custom includes path */
  includes: string;

  /** Options passed to Nunjucks */
  options: nunjucks.ConfigureOptions;

  /** Plugins loaded by Nunjucks */
  plugins: {
    [index: string]: nunjucks.Extension;
  };
}

// Default options
export const defaults: Options = {
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
  basePath: string;

  // deno-lint-ignore no-explicit-any
  constructor(env: any, basePath: string) {
    this.env = env;
    this.basePath = basePath;
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

/** Register the plugin to use Nunjucks as a template engine */
export default function (userOptions?: DeepPartial<Options>) {
  return (site: Site) => {
    const options = merge(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );
    const extensions = Array.isArray(options.extensions)
      ? { pages: options.extensions, components: options.extensions }
      : options.extensions;

    site.includes(extensions.pages, options.includes);

    const { formats } = site;
    const { includes } = site.options;
    const rootToRemove = site.src();

    const lumeLoader: nunjucks.ILoader = {
      async: true,
      resolve(from: string, to: string) {
        return posix.join(posix.dirname(from), to);
      },
      isRelative(filename: string) {
        return filename.startsWith(".");
      },
      async getSource(
        id: string,
        callback: nunjucks.Callback<Error, nunjucks.LoaderSource>,
      ) {
        let path = normalizePath(id, rootToRemove);

        if (path === normalizePath(id)) {
          const format = formats.search(id);
          const includesPath = format?.includesPath ?? includes;
          path = resolveInclude(id, includesPath, undefined, rootToRemove);
        }

        const content = await site.getContent(path, loader) as string;

        if (content) {
          callback(null, {
            src: content,
            path,
            noCache: false,
          });
          return;
        }

        callback(new Error(`Could not load ${path}`), null);
      },
    };

    const env = new nunjucks.Environment([lumeLoader], options.options);

    for (const [name, fn] of Object.entries(options.plugins)) {
      env.addExtension(name, fn);
    }

    site.hooks.addNunjucksPlugin = (name, fn) => {
      env.addExtension(name, fn);
    };

    const engine = new NunjucksEngine(env, site.src());

    site.loadPages(extensions.pages, loader, engine);
    site.includes(extensions.pages, options.includes);
    site.loadComponents(extensions.components, loader, engine);

    // Register the njk filter
    site.filter("njk", filter as Helper, true);

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
        throw new Exception(`Component "${name}" not found`);
      }

      const names = name.split(".") as string[];
      let component: ProxyComponents | ComponentFunction | undefined =
        components;

      while (names.length) {
        try {
          // @ts-ignore: `component` is defined or throw an error
          component = component[names.shift()];
        } catch {
          throw new Exception(`Component "${name}" not found`);
        }
      }

      if (typeof component === "function") {
        return component(props);
      }

      throw new Exception(`Component "${name}" not found`);
    }, {
      type: "tag",
      body: true,
    });

    function filter(string: string, data?: Data) {
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
