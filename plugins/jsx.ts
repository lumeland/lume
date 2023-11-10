import { React, ReactDOMServer } from "../deps/react.ts";
import loader from "../core/loaders/module.ts";
import { merge } from "../core/utils.ts";

import type Site from "../core/site.ts";
import type { Engine, Helper } from "../core/renderer.ts";
import type { Data } from "../core/file.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions?: string[];

  /** Optional sub-extension for page files */
  pageSubExtension?: string;

  /**
   * Custom includes path
   * @default `site.options.includes`
   */
  includes?: string;
}

// Default options
export const defaults: Options = {
  extensions: [".jsx", ".tsx"],
};

// JSX children type
export type Children = React.ReactNode | React.ReactNode[];

/** Template engine to render JSX files */
export class JsxEngine implements Engine {
  jsxImportSource = "npm:react";
  helpers: Record<string, Helper> = {};
  basePath: string;
  includes: string;

  constructor(basePath: string, includes: string) {
    this.basePath = basePath;
    this.includes = includes;
  }

  deleteCache() {}

  async render(content: unknown, data: Data = {}) {
    // The content is a string, so we have to convert to a React element
    if (typeof content === "string") {
      content = React.createElement("div", {
        dangerouslySetInnerHTML: { __html: content },
      });
    }

    // Create the children property
    let children = data.content;

    // If the children is a string, convert it to a React element
    if (typeof children === "string") {
      children = React.createElement("div", {
        dangerouslySetInnerHTML: { __html: children },
      });
    }

    const element = typeof content === "object" && React.isValidElement(content)
      ? content
      : ((typeof content === "function"
        ? await content({ ...data, children }, this.helpers)
        : content) as React.ReactElement);

    if (React.isValidElement(element)) {
      return {
        ...element,
        toString: () => ReactDOMServer.renderToStaticMarkup(element),
      };
    }

    return element;
  }

  renderComponent(content: unknown, data: Data = {}): { toString(): string } {
    const element = typeof content === "function"
      ? content(data, this.helpers)
      : content;

    if (React.isValidElement(element)) {
      return {
        ...element,
        toString: () => ReactDOMServer.renderToStaticMarkup(element),
      };
    }

    return element;
  }

  addHelper(name: string, fn: Helper) {
    this.helpers[name] = fn;
  }
}

/** Register the plugin to support JSX and TSX files */
export default function (userOptions?: Options) {
  return (site: Site) => {
    const options = merge(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );

    const engine = new JsxEngine(site.src("/"), options.includes);

    // Ignore includes folder
    if (options.includes) {
      site.ignore(options.includes);
    }

    // Load the pages and register the engine
    site.loadPages(options.extensions, {
      loader,
      engine,
      subExtension: options.pageSubExtension,
    });
  };
}
