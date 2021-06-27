import Engine from "./engine.ts";
import Site from "../site.js";

interface MarkdownEngine {
  render: (input: string) => string;
}

export default class Markdown extends Engine {
  engine: MarkdownEngine;

  constructor(site: Site, engine: MarkdownEngine) {
    super(site);
    this.engine = engine;
  }

  render(content: string) {
    return this.engine.render(content);
  }

  addHelper() {}
}
