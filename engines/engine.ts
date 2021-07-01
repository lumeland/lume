import Site from "../site.ts";
import { Data, Helper, HelperOptions } from "../types.ts";

/**
 * Abstract class extended by all template engines
 */
export default abstract class Engine {
  site: Site;

  constructor(site: Site) {
    this.site = site;
  }

  /**
   * Renders a template
   *
   * @param content The template content
   * @param data The data used to render the template
   * @param filename The filename of the template
   */
  abstract render(
    content: unknown,
    data: Data,
    filename: string,
  ): unknown | Promise<unknown>;

  /**
   * Adds a helper to the template engine
   *
   * @param name The helper name
   * @param fn The function assigned
   * @param options Options to configure the helper
   */
  abstract addHelper(
    name: string,
    fn: Helper,
    options: HelperOptions,
  ): void;
}
