import TemplateEngine from "./template_engine.ts";

export default class Markdown extends TemplateEngine {
  constructor(site, engine, options = {}) {
    super(site, options);
    this.engine = engine;
  }

  render(content) {
    return this.engine.render(content);
  }
}
