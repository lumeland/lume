import * as eta from "../deps/eta.js";

import TemplateEngine from "./templateEngine.js";

export default class Eta extends TemplateEngine {
  filters = {};

  constructor(site, options = {}) {
    super(site, options);

    eta.configure({
      views: site.src(this.includes),
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

  addFilter(name, fn, async) {
    this.filters[name] = fn;

    if (async) {
      eta.configure({ async: true });
    }
  }
}
