import nunjucks from "../deps/nunjucks.ts";
import TemplateEngine from "./template_engine.js";

export default class Nunjucks extends TemplateEngine {
  cache = new Map();

  constructor(site, engine) {
    super(site);
    this.engine = engine;

    // Update internal cache
    site.addEventListener("beforeUpdate", (ev) => {
      for (const file of ev.files) {
        this.cache.delete(site.src(file));
      }
    });
  }

  render(content, data, filename) {
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

  addHelper(name, fn, options) {
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
function createAsyncFilter(fn) {
  return async function (...args) {
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
function createCustomTag(name, fn, options) {
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

      fn(...args).then((string) => {
        const result = new nunjucks.runtime.SafeString(string);
        callback(null, result);
      });
    },
  };

  return tagExtension;
}
