import TemplateEngine from "./template_engine.js";

export default class Module extends TemplateEngine {
  filters = {};

  render(content, data) {
    if (typeof content === "function") {
      return content(data, this.filters);
    }

    return content;
  }

  addFilter(name, fn) {
    this.filters[name] = fn;
  }
}
