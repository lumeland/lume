import * as eta from "../deps/eta.ts";

import TemplateEngine from "./template_engine.ts";

export default class Eta extends TemplateEngine {
  filters = {};

  constructor(site, options = {}) {
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

  async render(content, data, filename) {
    if (!eta.templates.get(filename)) {
      eta.templates.define(filename, eta.compile(content));
    }
    data.filters = this.filters;
    const fn = eta.templates.get(filename);
    return await fn(data, eta.config);
  }

  addHelper(name, fn, options) {
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
