import * as eta from "../deps/eta.ts";
import Site from "../site.ts";
import Engine from "./engine.ts";
import { Data, HelperOptions } from "../types.ts";

export default class Eta extends Engine {
  filters: Record<string, unknown> = {};

  constructor(site: Site, options = {}) {
    super(site, options);

    eta.configure({
      views: site.src("_includes"),
      useWith: true,
    });

    // Update cache
    site.addEventListener("beforeUpdate", (ev) => {
      for (const filename of ev.files) {
        eta.templates.remove(site.src(filename));
      }
    });
  }

  async render(content: string, data: Data, filename: string) {
    if (!eta.templates.get(filename)) {
      eta.templates.define(filename, eta.compile(content));
    }
    data.filters = this.filters;
    const fn = eta.templates.get(filename);
    return await fn(data, eta.config);
  }

  addHelper(
    name: string,
    fn: (...args: unknown[]) => unknown,
    options: HelperOptions,
  ) {
    switch (options.type) {
      case "filter":
        this.filters[name] = fn;

        if (options.async) {
          eta.configure({ async: true });
        }
        return;
    }
  }
}
