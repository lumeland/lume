import TemplateEngine from "./template_engine.ts";

export default class Module extends TemplateEngine {
  helpers = {};

  render(content, data) {
    return typeof content === "function"
      ? content(data, this.helpers)
      : content;
  }

  addHelper(name, fn) {
    this.helpers[name] = fn;
  }
}
