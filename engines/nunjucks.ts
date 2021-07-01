import nunjucks from "../deps/nunjucks.ts";
import Site from "../site.js";
import Engine from "./engine.ts";
import { Data, Event, Helper, HelperOptions } from "../types.ts";

export default class Nunjucks extends Engine {
  engine: unknown;
  cache = new Map();

  constructor(site: Site, engine: unknown) {
    super(site);
    this.engine = engine;

    // Update internal cache
    site.addEventListener("beforeUpdate", (ev: Event) => {
      for (const file of ev.files!) {
        this.cache.delete(site.src(file));
      }
    });
  }

  render(content: string, data: Data, filename: string) {
    if (!this.cache.has(filename)) {
      this.cache.set(
        filename,
        nunjucks.compile(content, this.engine, filename),
      );
    }

    return new Promise((resolve, reject) => {
      this.cache.get(filename).render(data, (err: unknown, result: string) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  addHelper(name: string, fn: Helper, options: HelperOptions) {
    switch (options.type) {
      case "tag": {
        const tag = createCustomTag(name, fn, options);
        // @ts-ignore: this.engine is of type 'unknown'.
        this.engine.addExtension(name, tag);
        return;
      }

      case "filter":
        if (options.async) {
          const filter = createAsyncFilter(fn);
          // @ts-ignore: this.engine is of type 'unknown'.
          this.engine.addFilter(name, filter, true);
          return;
        }

        // @ts-ignore: this.engine is of type 'unknown'.
        this.engine.addFilter(name, fn);
    }
  }
}

/**
 * Function to create an asynchronous filter
 * Used to addapt the Promise-based functions to callbacks used by nunjucks
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
 * Function to create a tag extension
 * https://mozilla.github.io/nunjucks/api.html#custom-tags
 *
 * @param name The tag name
 * @param fn The function to render this tag
 * @param options Options to configure the tag
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
