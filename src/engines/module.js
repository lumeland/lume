import loadModule from "../formats/module.js";
import TemplateEngine from "./templateEngine.js";

export default class Module extends TemplateEngine {
  filters = {};

  render(content, data) {
    data.explorer = this.site.explorer;

    if (typeof content === "function") {
      return content(data, this.filters);
    }

    return content;
  }

  addFilter(name, fn) {
    this.filters[name] = fn;
  }

  async load(path) {
    return loadModule(path);
  }
}
