import * as pug from "../deps/pug.js";
import TemplateEngine from "./templateEngine.js";

export default class Pug extends TemplateEngine {
  cache = new Map();
  filters = {};

  constructor(site, options = {}) {
    super(site, options);

    //Update cache
    site.addEventListener("beforeUpdate", () => this.cache.clear());
  }

  render(content, data, filename) {
    if (!this.cache.has(filename)) {
      this.cache.set(
        filename,
        pug.compile(content, {
          filename,
          basedir: this.site.src("_includes"),
          filters: this.filters,
        }),
      );
    }

    return this.cache.get(filename)(data);
  }

  addFilter(name, fn) {
    this.filters[name] = (text, options) => {
      delete options.filename;
      const args = Object.values(options);
      return fn(text, ...args);
    };
  }
}
