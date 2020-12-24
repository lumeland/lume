import nunjucks from "../deps/nunjuks.js";
import TemplateEngine from "./templateEngine.js";

export default class Denjuks extends TemplateEngine {
  cache = new Map();

  constructor(site, options = {}) {
    super(site, options);

    this.loader = new nunjucks.FileSystemLoader(this.includes);
    this.engine = new nunjucks.Environment(this.loader);
  }

  //Update cache
  update(filenames) {
    for (const filename of filenames) {
      const name = this.loader.pathsToNames[filename];

      if (name) {
        delete this.loader.cache[name];
        continue;
      }

      this.cache.delete(filename);
    }
  }

  render(content, data, filename) {
    if (!this.cache.has(filename)) {
      this.cache.set(
        filename,
        nunjucks.compile(content, this.engine, filename),
      );
    }

    return this.cache.get(filename).render(data);
  }

  addFilter(name, fn) {
    this.engine.addFilter(name, fn);
  }
}
