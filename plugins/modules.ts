import loader from "../core/loaders/module.ts";
import { merge } from "../core/utils.ts";

import type { Data, Engine, Helper, Site } from "../core.ts";

export interface Options {
  /** The list of extensions used to load files */
  extensions: string[] | {
    pages: string[];
    data: string[];
    components: string[];
  };
}

// Default options
const defaults: Options = {
  extensions: {
    pages: [".tmpl.js", ".tmpl.ts"],
    data: [".js", ".ts"],
    components: [".js", ".ts"],
  },
};

/** Template engine to render js/ts files */
export class ModuleEngine implements Engine {
  helpers: Record<string, Helper> = {};

  deleteCache() {}

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

  const extensions = Array.isArray(options.extensions)
    ? {
      pages: options.extensions,
      data: options.extensions,
      components: options.extensions,
    }
    : options.extensions;

  return (site: Site) => {
    const engine = new ModuleEngine();

    site.loadData(extensions.data, loader);
    site.loadPages(extensions.pages, loader, engine);
    site.loadComponents(extensions.components, loader, engine);
  };
}
