import { parseFrontmatter } from "../loaders/yaml.js";

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
    try {
      const content = await Deno.readTextFile(path);
      return parseFrontmatter(content);
    } catch (err) {
      console.error(`Error loading the template ${path}`);
      console.error(err);
    }
  }
}
