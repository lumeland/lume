import * as eta from "../deps/eta.ts";
import { Data, Engine, Helper, HelperOptions } from "../types.ts";

export default class Eta implements Engine {
  engine: typeof eta;
  filters: Record<string, Helper> = {};

  constructor(engine: typeof eta) {
    this.engine = engine;
  }

  async render(content: string, data: Data, filename: string) {
    if (!this.engine.templates.get(filename)) {
      this.engine.templates.define(filename, this.engine.compile(content));
    }
    data.filters = this.filters;
    const fn = this.engine.templates.get(filename);
    return await fn(data, this.engine.config);
  }

  addHelper(name: string, fn: Helper, options: HelperOptions) {
    switch (options.type) {
      case "filter":
        this.filters[name] = fn;

        if (options.async) {
          this.engine.configure({ async: true });
        }
        return;
    }
  }
}
