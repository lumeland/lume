import * as pug from "../deps/pug.js";
import TemplateEngine from "./template_engine.js";

export default class Pug extends TemplateEngine {
  cache = new Map();
  filters = {};

  constructor(site, options = {}) {
    super(site, options);
    this.includes = site.src(site.options.includes);

    // Update cache
    site.addEventListener("beforeUpdate", () => this.cache.clear());
  }

  render(content, data, filename) {
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

  addHelper(name, fn, options) {
    switch (options.type) {
      case "filter":
        this.filters[name] = (text, opt) => {
          delete opt.filename;
          const args = Object.values(opt);
          return fn(text, ...args);
        };
        return;
    }
  }
}
