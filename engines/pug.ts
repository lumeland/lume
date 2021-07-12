import { Data, Engine, Helper, HelperOptions, Site } from "../types.ts";

export interface PugOptions {
  filters?: Record<string, Helper>;
  [key: string]: unknown;
}

export type PugCompiler = (
  input: string,
  options: Record<string, unknown>,
) => (data: Data) => string;

export default class Pug implements Engine {
  options: PugOptions;
  compiler: PugCompiler;
  cache: Map<string, (data: Data) => string> = new Map();

  constructor(site: Site, compiler: PugCompiler, options: PugOptions) {
    this.compiler = compiler;
    this.options = options;

    // Update cache
    site.addEventListener("beforeUpdate", () => this.cache.clear());
  }

  render(content: string, data: Data, filename: string) {
    if (!this.cache.has(filename)) {
      this.cache.set(
        filename,
        this.compiler(content, {
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
