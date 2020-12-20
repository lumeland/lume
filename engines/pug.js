import * as pug from "../deps/pug.js";
import TemplateEngine from "./templateEngine.js";

export default class Pug extends TemplateEngine {
  cache = new Map();
  filters = {};

  //Update cache
  update(filenames) {
    for (const filename of filenames) {
      this.cache.delete(filename);
    }
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
    this.filters[name] = fn;
  }
}
