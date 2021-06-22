import Site from "../site.ts";
import * as pug from "../deps/pug.ts";
import Engine from "./engine.ts";
import { Data, HelperOptions } from "../types.ts";

export default class Pug extends Engine {
  cache = new Map();
  filters: Record<string, unknown> = {};
  includes: string;

  constructor(site: Site, options = {}) {
    super(site, options);
    this.includes = site.src("_includes");

    // Update cache
    site.addEventListener("beforeUpdate", () => this.cache.clear());
  }

  render(content: unknown, data: Data, filename: string) {
    if (!this.cache.has(filename)) {
      this.cache.set(
        filename,
        pug.compile(content, {
          filename,
          basedir: this.includes,
          filters: this.filters,
        }),
      );
    }

    return this.cache.get(filename)(data);
  }

  addHelper(
    name: string,
    fn: (...args: unknown[]) => unknown,
    options: HelperOptions,
  ) {
    switch (options.type) {
      case "filter":
        this.filters[name] = (text: string, opt: Record<string, unknown>) => {
          delete opt.filename;
          const args = Object.values(opt);
          return fn(text, ...args);
        };
        return;
    }
  }
}
