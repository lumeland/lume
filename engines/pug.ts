import Site from "../site.js";
import Engine from "./engine.ts";
import { Data, Helper, HelperOptions } from "../types.ts";

interface Options {
  filters: Record<string, Helper>;
}

interface PugEngine {
  compile: (
    input: string,
    options: Record<string, unknown>,
  ) => (data: Data) => string;
}

export default class Pug extends Engine {
  options: Options;
  engine: PugEngine;
  cache: Map<string, (data: Data) => string> = new Map();

  constructor(site: Site, engine: PugEngine, options: Options) {
    super(site);
    this.engine = engine;
    this.options = options;

    // Update cache
    site.addEventListener("beforeUpdate", () => this.cache.clear());
  }

  render(content: string, data: Data, filename: string) {
    if (!this.cache.has(filename)) {
      this.cache.set(
        filename,
        this.engine.compile(content, {
          ...this.options,
          filename,
        }),
      );
    }

    return this.cache.get(filename)!(data);
  }

  addHelper(name: string, fn: Helper, options: HelperOptions) {
    switch (options.type) {
      case "filter":
        this.options.filters ||= {};
        this.options.filters[name] = (text, opt) => {
          // @ts-ignore: opt is of type 'unknown'.
          delete opt.filename;
          // @ts-ignore: opt is of type 'unknown'.
          const args = Object.values(opt);
          return fn(text, ...args);
        };
        return;
    }
  }
}
