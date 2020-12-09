import { parseFrontmatter } from "../loaders/yaml.js";

export default class TemplateEngine {
  constructor(site, options = {}) {
    this.site = site;
    this.includes = "_includes";
    this.options = options;
  }

  beforeRender() {
    //To extend
  }

  render(content, data) {
    //To extend
  }

  addFilter(name, fn) {
    //To extend
  }

  async load(path) {
    const content = await Deno.readTextFile(path);
    return parseFrontmatter(content);
  }
}
