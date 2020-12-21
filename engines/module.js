import { default as loader, removeCache } from "../loaders/module.js";
import TemplateEngine from "./templateEngine.js";

export default class Module extends TemplateEngine {
  filters = {};

  //Update cache
  update(filenames) {
    for (const filename of filenames) {
      removeCache(filename);
    }
  }

  render(content, data) {
    if (typeof content === "function") {
      return content(data, this.filters);
    }

    return content;
  }

  addFilter(name, fn) {
    this.filters[name] = fn;
  }

  async load(path) {
    return loader(path);
  }
}
