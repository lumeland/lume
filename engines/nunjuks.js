import nunjucks from "../deps/nunjuks.js";
import TemplateEngine from "./templateEngine.js";

export default class Denjuks extends TemplateEngine {
  constructor(site, options = {}) {
    super(site, options);

    const loader = new nunjucks.FileSystemLoader(this.includes);
    this.engine = new nunjucks.Environment(loader);
  }

  beforeRender() {
    //Remove previous cache (if watching)
    this.engine.loaders.forEach((loader) => loader.cache = {});
  }

  render(content, data) {
    return this.engine.renderString(content, data);
  }

  addFilter(name, fn) {
    this.engine.addFilter(name, fn);
  }
}
