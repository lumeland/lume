import loader from "../loaders/text.js";

export default class TemplateEngine {
  constructor(site, options = {}) {
    this.site = site;
    this.includes = "_includes";
    this.options = options;
  }

  render(content, data, filename) {
    //To extend
  }

  addFilter(name, fn, async) {
    //To extend
  }

  async load(path) {
    return loader(path, this.site.source);
  }
}
