import TemplateEngine from "./template_engine.js";

export default class Pug extends TemplateEngine {
  cache = new Map();

  constructor(site, engine, options) {
    super(site);
    this.engine = engine;
    this.options = options;

    // Update cache
    site.addEventListener("beforeUpdate", () => this.cache.clear());
  }

  render(content, data, filename) {
    if (!this.cache.has(filename)) {
      this.cache.set(
        filename,
        this.engine.compile(content, {
          ...this.options,
          filename,
        }),
      );
    }

    return this.cache.get(filename)(data);
  }

  addHelper(name, fn, options) {
    switch (options.type) {
      case "filter":
        this.options.filters ||= {};
        this.options.filters[name] = (text, opt) => {
          delete opt.filename;
          const args = Object.values(opt);
          return fn(text, ...args);
        };
        return;
    }
  }
}
