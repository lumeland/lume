import TemplateEngine from "./template_engine.js";

export default class Markdown extends TemplateEngine {
  constructor(site, engine) {
    super(site);
    this.engine = engine;
  }

  render(content) {
    return this.engine.render(content);
  }
}
