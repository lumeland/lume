import Site from "../site.ts";
import nunjucks from "../deps/nunjucks.ts";
import Engine from "./engine.ts";
import { Data, HelperOptions } from "../types.ts";

export default class Nunjucks extends Engine {
  cache = new Map();

  constructor(site: Site, options: Record<string, unknown>) {
    super(site, options);

    const loader = new nunjucks.FileSystemLoader(site.src("_includes"));
    this.engine = new nunjucks.Environment(loader, options);

    // Update cache
    site.addEventListener("beforeUpdate", (ev) => {
      for (const file of ev.files) {
        const filename = site.src(file);
        const name = loader.pathsToNames[filename];

        if (name) {
          delete loader.cache[name];
          continue;
        }

        this.cache.delete(filename);
      }
    });
  }

  render(content: string, data: Data, filename: string): Promise<unknown> {
    if (!this.cache.has(filename)) {
      this.cache.set(
        filename,
        nunjucks.compile(content, this.engine, filename),
      );
    }

    return new Promise((resolve, reject) => {
      this.cache.get(filename).render(data, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  addHelper(
    name: string,
    fn: (...args: unknown[]) => unknown,
    options: HelperOptions,
  ) {
    switch (options.type) {
      case "tag": {
        const tag = createCustomTag(name, fn, options);
        this.engine.addExtension(name, tag);
        return;
      }

      case "filter":
        if (options.async) {
          const filter = createAsyncFilter(fn);
          this.engine.addFilter(name, filter, true);
          return;
        }

        this.engine.addFilter(name, fn);
    }
  }
}

// Function to create an asynchronous filter
// https://mozilla.github.io/nunjucks/api.html#custom-filters
function createAsyncFilter(fn: (...args: unknown[]) => unknown) {
  return async function (...args: unknown[]) {
    const cb = args.pop();
    try {
      const result = await fn(...args);
      cb(null, result);
    } catch (err) {
      cb(err);
    }
  };
}

// Function to create a tag extension
// https://mozilla.github.io/nunjucks/api.html#custom-tags
function createCustomTag(
  name: string,
  fn: (...args: unknown[]) => unknown,
  options: HelperOptions,
) {
  const tagExtension = {
    tags: [name],
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
    run(_context, ...args) {
      if (options.body) {
        const [body] = args.splice(
          options.async ? args.length - 2 : args.length - 1,
          1,
        );
        args.unshift(body());
      }

      if (!options.async) {
        return fn(...args);
      }

      const callback = args.pop();

      fn(...args).then((string: string) => {
        const result = new nunjucks.runtime.SafeString(string);
        callback(null, result);
      });
    },
  };

  return tagExtension;
}
