import * as eta from "../deps/eta.js";

import TemplateEngine from "./templateEngine.js";

export default class Eta extends TemplateEngine {
  filters = {};

  constructor(site, options = {}) {
    super(site, options);

    eta.configure({
      views: this.includes,
      useWith: true,
    });
  }

  render(content, data, filename) {
    if (!eta.templates.get(filename)) {
      eta.templates.define(filename, Eta.compile(content));
    }
    data.filters = this.filters;
    return eta.templates.get(filename)(data);
  }

  addFilter(name, fn) {
    this.filters[name] = fn;
  }
}
