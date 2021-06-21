import Site from "../site.ts";
import {Data} from "../types.ts";

export default class Engine {
  site: Site;
  options: Record<string, unknown>;

  constructor(site: Site, options = {}) {
    this.site = site;
    this.options = options;
  }

  render(_content: unknown, _data: Data, _filename: string) {
    // To extend
  }

  addHelper(_name: string, _fn: Function, _options: unknown) {
    // To extend
  }
}
