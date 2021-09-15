import { Data, Engine } from "../../core.ts";

interface MarkdownEngine {
  render: (input: string, env?: Record<string, unknown>) => string;
}

export default class Markdown implements Engine {
  engine: MarkdownEngine;

  constructor(engine: MarkdownEngine) {
    this.engine = engine;
  }

  render(content: string, _data: Data, filename: string): string {
    return this.engine.render(content, { filename });
  }

  addHelper() {}
}
