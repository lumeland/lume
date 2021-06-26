import TemplateEngine from "./template_engine.js";

export default class Eta extends TemplateEngine {
  filters = {};

  constructor(site, engine) {
    super(site);
    this.engine = engine;
  }

  async render(content, data, filename) {
    if (!this.engine.templates.get(filename)) {
      this.engine.templates.define(filename, this.engine.compile(content));
    }
    data.filters = this.filters;
    const fn = this.engine.templates.get(filename);
    return await fn(data, this.engine.config);
  }

  addHelper(name, fn, options) {
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
