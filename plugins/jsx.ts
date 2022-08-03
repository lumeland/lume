import { encode } from "../deps/base64.ts";
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

// JSX children type
export type Children = React.ReactNode | React.ReactNode[];

// Ensure React is available in the global scope
// so no need to import it in every file
window.React ||= React;

/** Template engine to render JSX files */
export class JsxEngine implements Engine {
  helpers: Record<string, Helper> = {};

  deleteCache() {}

  // deno-lint-ignore no-explicit-any
  async parseJSX(content: string, data: Data = {}): Promise<any> {
    const datakeys = Object.keys(data).join(",");
    const fn =
      `export default function ({${datakeys}}, helpers) { return <>${content}</> }`;
    const url = `data:text/jsx;base64,${encode(fn)}`;
    return (await import(url)).default;
  }

  async render(content: unknown, data: Data = {}) {
    if (typeof content === "string") {
      content = await this.parseJSX(content, data);
    }

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
