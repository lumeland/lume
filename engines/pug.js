import * as pug from "../deps/pug.js";
import TemplateEngine from "./templateEngine.js";

export default class Pug extends TemplateEngine {
  filters = {};

  constructor(site, options = {}) {
    super(site, options);
  }

  render(content, data, filename) {
    const fn = pug.compile(content, {
      filename,
      basedir: this.site.src("_includes"),
      filters: this.filters,
      cache: true,
    });

    return fn(data);
  }

  addFilter(name, fn) {
    this.filters[name] = fn;
  }
}
