import Engine from "./engine.ts";
import Site from "../site.ts";

export default class Markdown extends Engine {
  constructor(site: Site, engine, options = {}) {
    super(site, options);
    this.engine = engine;
  }

  render(content: string) {
    return this.engine.render(content);
  }

  addHelper() {
  }
}
