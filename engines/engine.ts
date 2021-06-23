import Site from "../site.ts";
import { Data, Helper, HelperOptions } from "../types.ts";

export default abstract class Engine {
  site: Site;
  options: Record<string, unknown>;

  constructor(site: Site, options = {}) {
    this.site = site;
    this.options = options;
  }

  abstract render(
    content: unknown,
    data: Data,
    filename: string,
  ): Promise<unknown>;

  abstract addHelper(
    name: string,
    fn: Helper,
    options: HelperOptions,
  ): void;
}
