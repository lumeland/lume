export default class TemplateEngine {
  constructor(site) {
    this.site = site;
  }

  render(_content, _data, _filename) {
    // To extend
  }

  addHelper(_name, _fn, _options) {
    // To extend
  }
}
