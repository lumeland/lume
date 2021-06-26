import TemplateEngine from "./template_engine.js";

export default class Pug extends TemplateEngine {
  cache = new Map();
  filters = {};

  constructor(site, engine, basedir) {
    super(site);
    this.engine = engine;
    this.basedir = basedir;

    // Update cache
    site.addEventListener("beforeUpdate", () => this.cache.clear());
  }

  render(content, data, filename) {
    if (!this.cache.has(filename)) {
      this.cache.set(
        filename,
        this.engine.compile(content, {
          filename,
          basedir: this.basedir,
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
