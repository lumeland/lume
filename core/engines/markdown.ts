import { Engine } from "../../core.ts";

interface MarkdownEngine {
  render: (input: string) => string;
}

export default class Markdown implements Engine {
  engine: MarkdownEngine;

  constructor(engine: MarkdownEngine) {
    this.engine = engine;
  }

  render(content: string) {
    return this.engine.render(content);
  }

  addHelper() {}
}
