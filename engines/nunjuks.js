import nunjucks from "../../deps/nunjuks.js";
import TemplateEngine from "./templateEngine.js";

export default class Denjuks extends TemplateEngine {
  constructor(site, options = {}) {
    super(site, options);

    const loader = new nunjucks.FileSystemLoader(this.includes);
    this.engine = new nunjucks.Environment(loader);
  }

  render(content, data) {
    data.explorer = this.site.explorer;
    return this.engine.renderString(content, data);
  }

  addFilter(name, fn) {
    this.engine.addFilter(name, fn);
  }
}
