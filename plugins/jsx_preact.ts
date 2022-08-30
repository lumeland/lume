import {
  importSource,
  isValidElement,
  renderToString,
} from "../deps/preact.ts";
import loader from "../core/loaders/module.ts";
import { merge, parseJSX } from "../core/utils.ts";
import { dirname, join, toFileUrl } from "../deps/path.ts";

import type { Data, Engine, Helper, Site } from "../core.ts";
import type { ComponentChildren } from "../deps/preact.ts";

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
export type Children = ComponentChildren;

/** Template engine to render JSX files using Preact */
export class PreactJsxEngine implements Engine {
  helpers: Record<string, Helper> = {};
  basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  deleteCache() {}

  // deno-lint-ignore no-explicit-any
  parseJSX(content: string, data: Data = {}, filename?: string): Promise<any> {
    const baseUrl = filename
      ? toFileUrl(join(this.basePath, dirname(filename)))
      : toFileUrl(this.basePath);

    const jsxSource = `/** @jsxImportSource ${importSource} */`;

    return parseJSX(baseUrl, content, data, jsxSource);
  }

  async render(content: unknown, data: Data = {}, filename?: string) {
    // The content is a string, so we have to convert to a Preact element
    if (typeof content === "string") {
      content = await this.parseJSX(content, data, filename);
    }

    // Create the children property
    let children = data.content;

    // If the children is a string, convert it to a Preact element
    if (typeof children === "string") {
      const fn = await this.parseJSX(children, data, filename);
      children = await fn({ ...data }, this.helpers);
    }

    const element = typeof content === "object" && isValidElement(content)
      ? content
      : (typeof content === "function"
        ? await content({ ...data, children }, this.helpers)
        : content) as preact.VNode;

    if (element && typeof element === "object") {
      element.toString = () => renderToString(element);
    }

    return element;
  }

  renderSync(content: unknown, data: Data = {}): string {
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
  const options = merge(defaults, userOptions);
  const extensions = Array.isArray(options.extensions)
    ? { pages: options.extensions, components: options.extensions }
    : options.extensions;

  return (site: Site) => {
    const engine = new PreactJsxEngine(site.src());

    site.loadPages(extensions.pages, loader, engine);
    site.loadComponents(extensions.components, loader, engine);
  };
}
