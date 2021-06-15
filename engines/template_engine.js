export default class TemplateEngine {
  constructor(site, options = {}) {
    this.site = site;
    this.options = options;
  }

  render(_content, _data, _filename) {
    // To extend
  }

  addHelper(_name, _fn, _options) {
    // To extend
  }
}
