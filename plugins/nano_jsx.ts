import { h, initSSR } from "../deps/nano_jsx.ts";
import loader from "../core/loaders/module.ts";
import { merge } from "../core/utils.ts";

import type { Data, Engine, Helper, Site } from "../core.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[] | {
    pages: string[];
    components: string[];
  };
}

// Default options
export const defaults: Options = {
  extensions: [".jsx", ".tsx"],
};

initSSR();

/** Template engine to render JSX files using NanoJSX */
export class NanoJsxEngine implements Engine {
  helpers: Record<string, Helper> = {};

  deleteCache() {}

  async render(content: unknown, data: Data = {}) {
    if (!data.children && data.content) {
      data.children = h("div", {
        dangerouslySetInnerHTML: { __html: data.content },
      });
    }
    const element = typeof content === "object"
      ? content
      : (typeof content === "function"
        ? await content(data, this.helpers)
        : content);

    data.children = element;

    return element;
  }

  renderSync(content: unknown, data: Data = {}): string {
    const element = typeof content === "function"
      ? content(data, this.helpers)
      : content;

    return element;
  }

  addHelper(name: string, fn: Helper) {
    this.helpers[name] = fn;
  }
}

/** Register the plugin to support JSX and TSX files */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);
  const extensions = Array.isArray(options.extensions)
    ? { pages: options.extensions, components: options.extensions }
    : options.extensions;

  return (site: Site) => {
    const engine = new NanoJsxEngine();

    site.loadPages(extensions.pages, loader, engine);
    site.loadComponents(extensions.components, loader, engine);
  };
}
