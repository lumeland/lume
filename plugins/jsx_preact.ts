import { preact, renderToString } from "../deps/preact.ts";
import loader from "../core/loaders/module.ts";
import { merge } from "../core/utils.ts";

import type { Data, Engine, Helper, Site } from "../core.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /** Optional sub-extension for page files */
  pageSubExtension?: string;

  /**
   * Custom includes path
   * @default `site.options.includes`
   */
  includes: string;
}

// Default options
export const defaults: Options = {
  extensions: [".jsx", ".tsx"],
  includes: "",
};

// JSX children type
export type Children = preact.ComponentChildren;

/** Template engine to render JSX files using Preact */
export class PreactJsxEngine implements Engine {
  helpers: Record<string, Helper> = {};
  basePath: string;
  includes: string;

  constructor(basePath: string, includes: string) {
    this.basePath = basePath;
    this.includes = includes;
  }

  deleteCache() {}

  async render(content: unknown, data: Data = {}) {
    // The content is a string, so we have to convert it to a Preact element
    if (typeof content === "string") {
      content = preact.h("div", {
        dangerouslySetInnerHTML: { __html: content },
      });
    }

    // Create the children property
    let children = data.content;

    // If the children is a string, convert it to a Preact element
    if (typeof children === "string") {
      children = preact.h("div", {
        dangerouslySetInnerHTML: { __html: children },
      });
    }

    const element =
      typeof content === "object" && preact.isValidElement(content)
        ? content
        : (typeof content === "function"
          ? await content({ ...data, children }, this.helpers)
          : content) as preact.VNode;

    if (element && typeof element === "object") {
      element.toString = () => renderToString(element);
    }

    return element;
  }

  renderComponent(content: unknown, data: Data = {}) {
    const element = typeof content === "function"
      ? content(data, this.helpers)
      : content;

    if (element && typeof element === "object") {
      element.toString = () => renderToString(element);
    }

    return element;
  }

  addHelper(name: string, fn: Helper) {
    this.helpers[name] = fn;
  }
}

/** Register the plugin to support JSX and TSX files */
export default function (userOptions?: Partial<Options>) {
  return (site: Site) => {
    const options = merge(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );

    const engine = new PreactJsxEngine(site.src(), options.includes);

    site.loadComponents(options.extensions, loader, engine);
    site.loadPages(options.extensions, {
      loader,
      engine,
      subExtension: options.pageSubExtension,
    });
  };
}
