import loader from "../loaders/text.js";

export default class TemplateEngine {
  constructor(site, options = {}) {
    this.site = site;
    this.includes = "_includes";
    this.options = options;
  }

  render(_content, _data, _filename) {
    // To extend
  }

  addFilter(_name, _fn, _async) {
    // To extend
  }

  load(path) {
    return loader(path, this.site.source);
  }
}
