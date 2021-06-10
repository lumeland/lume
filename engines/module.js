import TemplateEngine from "./template_engine.js";

export default class Module extends TemplateEngine {
  filters = {};

  render(content, data) {
    return typeof content === "function"
      ? content(data, this.filters)
      : content;
  }

  addFilter(name, fn) {
    this.filters[name] = fn;
  }
}
