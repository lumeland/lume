import { renderComponent } from "../deps/ssx.ts";
import loader from "@lumeland/core/loaders/module.ts";
import { merge } from "@lumeland/core/utils/object.ts";

import type Site from "@lumeland/core/site.ts";
import type { Engine, Helper } from "@lumeland/core/renderer.ts";

export interface Options {
  /** File extensions to load */
  extensions?: string[];

  /** Optional sub-extension for page files */
  pageSubExtension?: string;
}

// Default options
export const defaults = {
  extensions: [".jsx", ".tsx"],
  pageSubExtension: ".page",
} satisfies Options;

/** Template engine to render JSX files */
export class JsxEngine implements Engine {
  helpers: Record<string, Helper> = {};

  deleteCache() {}

  async render(content: unknown, data: Record<string, unknown> = {}) {
    // If content is a string, convert to a JSX element
    if (typeof content === "string") {
      content = { __html: content };
    }

    // Create the children property
    let children = data.content ?? data.children;

    // If the children is a string, convert to a JSX element
    if (typeof children === "string") {
      children = { __html: children };
    }

    const result =
      typeof content === "function" ? await content({ ...data, children }, this.helpers) : content;

    return typeof result === "string" ? result : renderComponent(result);
  }

  addHelper(name: string, fn: Helper) {
    this.helpers[name] = fn;
  }
}

/**
 * A plugin to render JSX files to HTML
 * @see https://lume.land/plugins/jsx/
 */
export function jsx(userOptions?: Options) {
  return (site: Site) => {
    const options = merge(defaults, userOptions);
    const engine = new JsxEngine();

    // Load the pages and register the engine
    site.loadPages(options.extensions, {
      loader,
      engine,
      pageSubExtension: options.pageSubExtension,
    });
  };
}

export default jsx;

/** Extends global data interface */
declare global {
  namespace Lume {
    export interface GlobalData {
      /**
       * The JSX children elements
       * @see https://lume.land/plugins/jsx/
       */
      children?: JSX.Children;
    }
  }
}
