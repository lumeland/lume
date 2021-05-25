export default class TemplateEngine {
  constructor(site, options = {}) {
    this.site = site;
    this.options = options;
  }

  render(_content, _data, _filename) {
    // To extend
  }

  addFilter(_name, _fn, _async) {
    // To extend
  }
}
