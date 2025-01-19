import { preact, renderToString, specifier } from "../deps/preact.ts";
import loader from "../core/loaders/module.ts";
import { merge } from "../core/utils/object.ts";

import type Site from "../core/site.ts";
import type { Engine, Helper } from "../core/renderer.ts";

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
export type Children = preact.ComponentChildren;

/** Template engine to render JSX files using Preact */
export class PreactJsxEngine implements Engine {
  jsxImportSource = specifier;
  helpers: Record<string, Helper> = {};
  basePath: string;
  includes: string;

  constructor(basePath: string, includes: string) {
    this.basePath = basePath;
    this.includes = includes;
  }

  deleteCache() {}

  async render(content: unknown, data: Record<string, unknown> = {}) {
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
      // @ts-ignore - Preact types are not up to date
      element.toString = () => renderToString(element);
    }

    return element;
  }

  renderComponent(content: unknown, data: Record<string, unknown> = {}) {
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

/**
 * A plugin to render JSX files using Preact
 * @see https://lume.land/plugins/jsx_preact/
 */
export function jsxPreact(userOptions?: Options) {
  return (site: Site) => {
    const options = merge(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );

    const engine = new PreactJsxEngine(site.src(), options.includes);

    // Ignore includes folder
    if (options.includes) {
      site.ignore(options.includes);
    }

    // Load the pages and register the engine
    site.loadPages(options.extensions, {
      loader,
      engine,
      pageSubExtension: options.pageSubExtension,
    });
  };
}

export default jsxPreact;

declare global {
  namespace preact.JSX {
    /** Extends HTMLAttributes interface */
    interface HTMLAttributes {
      /** Custom attribute used by inline plugin */
      inline?: boolean | undefined;

      /** Custom attribute used by transform images plugin */
      "transform-images"?: string | undefined;
    }
  }

  /** Extends Data interface */
  namespace Lume {
    export interface Data {
      /**
       * The JSX children elements
       * @see https://lume.land/plugins/jsx_preact/
       */
      // @ts-ignore - jsx and jsx_preact conflict
      children?: preact.ComponentChildren;
    }
  }
}
