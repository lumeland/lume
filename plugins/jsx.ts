import { React, ReactDOMServer } from "../deps/react.ts";
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

// Ensure React is available in the global scope
// so no need to import it in every file
window.React ||= React;

/** Template engine to render JSX files */
export class JsxEngine implements Engine {
  helpers: Record<string, Helper> = {};

  deleteCache() {}

  async render(content: unknown, data: Data = {}) {
    if (!data.children && data.content) {
      data.children = React.createElement("div", {
        dangerouslySetInnerHTML: { __html: data.content },
      });
    }

    const element = typeof content === "object" && React.isValidElement(content)
      ? content
      : (typeof content === "function"
        ? await content(data, this.helpers)
        : content) as React.ReactElement;

    data.children = element;

    if (element && typeof element === "object") {
      element.toString = () => ReactDOMServer.renderToStaticMarkup(element);
    }

    return element;
  }

  renderSync(content: unknown, data: Data = {}): { toString(): string } {
    const element = typeof content === "function"
      ? content(data, this.helpers)
      : content;

    if (element && typeof element === "object") {
      element.toString = () => ReactDOMServer.renderToStaticMarkup(element);
    }

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
    const engine = new JsxEngine();

    site.loadPages(extensions.pages, loader, engine);
    site.loadComponents(extensions.components, loader, engine);
  };
}
