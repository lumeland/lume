import { encode } from "../deps/base64.ts";
import { React, ReactDOMServer } from "../deps/react.ts";
import loader from "../core/loaders/module.ts";
import { merge } from "../core/utils.ts";
import { dirname, toFileUrl } from "../deps/path.ts";

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
  baseUrl: URL;

  constructor(basePath: string) {
    this.baseUrl = toFileUrl(basePath);
  }

  deleteCache() {}

  async render(content: unknown, data: Data = {}, filename?: string) {
    // The content is a string, so we have to convert to a React element
    if (typeof content === "string") {
      const basedir = filename ? "." + dirname(filename) : "./";
      content = await parseJSX(new URL(basedir, this.baseUrl), content, data);
    }

    // Create the children property and ensure it's a React element
    const children = typeof data.content === "string"
      ? React.createElement("div", {
        dangerouslySetInnerHTML: { __html: data.content },
      })
      : data.content;

    const element = typeof content === "object" && React.isValidElement(content)
      ? content
      : (typeof content === "function"
        ? await content({ ...data, children }, this.helpers)
        : content) as React.ReactElement;

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
    const engine = new JsxEngine(site.src());

    site.loadPages(extensions.pages, loader, engine);
    site.loadComponents(extensions.components, loader, engine);
  };
}

export async function parseJSX(
  baseUrl: URL,
  content: string,
  data: Data = {},
  // deno-lint-ignore no-explicit-any
): Promise<any> {
  // Collect imports
  const imports: string[] = [];

  content = content.replaceAll(
    /import\s+[\w\W]+?\s+from\s+("[^"]+"|'[^']+');?/g,
    (code, path) => {
      // Resolve relative urls
      const quote = path.slice(0, 1);
      let url = path.slice(1, -1);
      if (url.startsWith(".")) {
        url = new URL(url, baseUrl).href;
        code = code.replace(path, quote + url + quote);
      }
      imports.push(code);
      return "";
    },
  ).trim();

  // Destructure arguments
  const destructure = `{${Object.keys(data).join(",")}}`;
  // Keep the line breaks (\n -> {"\n"})
  content = content.replaceAll(/(\n\r?)/g, '{"\\n"}');

  const fn = `${
    imports.join("\n")
  }\nexport default async function (${destructure}, helpers) { return <>${content}</> }`;
  const url = `data:text/jsx;base64,${encode(fn)}`;
  return (await import(url)).default;
}
