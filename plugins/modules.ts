import loader from "../core/loaders/module.ts";
import { merge } from "../core/utils.ts";

import type { Data, Engine, Helper, Site } from "../core.ts";

export interface Options {
  /** The list of extensions used to load data */
  dataExtensions: string[];

  /** The list of extensions used to load pages */
  pagesExtensions: string[];
}

// Default options
const defaults: Options = {
  dataExtensions: [".js", ".ts"],
  pagesExtensions: [".tmpl.js", ".tmpl.ts"],
};

/** Template engine to render js/ts files */
export class ModuleEngine implements Engine {
  helpers: Record<string, Helper> = {};

  async render(content: unknown, data: Data): Promise<unknown> {
    return typeof content === "function"
      ? await content(data, this.helpers)
      : content;
  }

  renderSync(content: unknown, data: Data): string {
    return typeof content === "function"
      ? content(data, this.helpers)
      : content;
  }

  addHelper(name: string, fn: Helper) {
    this.helpers[name] = fn;
  }
}

/** Register the plugin to load JavaScript/TypeScript modules */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadPages(options.pagesExtensions, loader, new ModuleEngine());
    site.loadData(options.dataExtensions, loader);
  };
}
