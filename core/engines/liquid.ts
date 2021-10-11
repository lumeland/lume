import { Liquid as Liquidjs } from "../../deps/liquid.ts";
import {
  Data,
  Engine,
  Event,
  Helper,
  HelperOptions,
  Site,
} from "../../core.ts";

export default class Liquid implements Engine {
  engine: Liquidjs;
  cache = new Map();

  constructor(site: Site, engine: Liquidjs) {
    this.engine = engine;

    // Update the internal cache
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
        this.engine.parse(content, filename),
      );
    }
    const template = this.cache.get(filename);
    return this.engine.render(template, data);
  }

  addHelper(name: string, fn: Helper, options: HelperOptions) {
    switch (options.type) {
      case "filter":
        this.engine.registerFilter(name, fn);
        break;
    }
  }
}
