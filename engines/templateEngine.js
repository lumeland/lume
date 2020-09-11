import { parseFrontmatter } from "../loaders/yaml.js";
import { join } from "../deps/path.js";

export default class TemplateEngine {
  constructor(site, options = {}) {
    this.site = site;
    this.includes = join(site.options.src, "_includes");
    this.options = options;
  }

  render(content, data) {
    //To implement
  }

  addFilter(name, fn) {
    //To implement
  }

  async load(path) {
    const content = await Deno.readTextFile(path);
    return parseFrontmatter(content);
  }
}
