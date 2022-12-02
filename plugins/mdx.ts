import loader from "../core/loaders/text.ts";
import { merge } from "../core/utils.ts";
import { compile } from "../deps/mdx.ts";
import { join, toFileUrl } from "../deps/path.ts";
import { encode } from "../deps/base64.ts";
import { remarkGfm } from "../deps/remark.ts";

import type { Data, Engine, Site } from "../core.ts";

export interface Options {
  /** List of extensions this plugin applies to */
  extensions: string[];

  /** List of remark plugins to use */
  // deno-lint-ignore no-explicit-any
  remarkPlugins?: any[];

  /** List of rehype plugins to use */
  // deno-lint-ignore no-explicit-any
  rehypePlugins?: any[];

  /** Flag to override the default plugins */
  overrideDefaultPlugins?: boolean;

  /** Optional pragma to add to the code evaluation */
  pragma?: string;
}

// Default options
export const defaults: Options = {
  extensions: [".mdx"],
  // By default, GitHub-flavored markdown is enabled
  remarkPlugins: [remarkGfm],
};

/** Template engine to render Markdown files with Remark */
export class MDXEngine implements Engine<string | { toString(): string }> {
  baseUrl: string;
  options: Options;
  jsxEngine: Engine;

  constructor(baseUrl: string, options: Options, jsxEngine: Engine) {
    this.baseUrl = baseUrl;
    this.options = options;
    this.jsxEngine = jsxEngine;
  }

  deleteCache() {}

  async render(
    content: string,
    data?: Data,
    filename?: string,
  ) {
    const baseUrl = toFileUrl(join(this.baseUrl, filename!)).href;

    const result = await compile(content, {
      jsxImportSource: "",
      baseUrl,
      jsx: true,
      format: "mdx",
      outputFormat: "function-body",
      useDynamicImport: true,
      remarkPlugins: this.options.remarkPlugins,
      rehypePlugins: this.options.rehypePlugins,
    });

    const destructure = `{${Object.keys(data!).join(",")}}`;
    const pragma = this.options.pragma || "";
    const code = `${pragma}
export default async function (${destructure}) {
  ${result.toString()}
}
    `;

    const url = `data:text/jsx;base64,${encode(code)}`;
    const module = (await import(url)).default;
    const mdxContext = (await module(data)).default;

    const body = mdxContext({ components: { comp: data?.comp } });
    return this.jsxEngine.renderSync(body);
  }

  renderSync(content: string) {
    return content;
  }

  addHelper() {}
}

/** Register the plugin to support MDX */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  if (options.remarkPlugins && !options.overrideDefaultPlugins) {
    options.remarkPlugins.push(...defaults.remarkPlugins!);
  }

  return function (site: Site) {
    // Get the JSX stringify
    const format = site.formats.get(".jsx") || site.formats.get(".tsx");

    if (!format?.engines) {
      throw new Error(
        "The JSX format is required to use the MDX plugin. Use jsx or jsx_preact plugins.",
      );
    }

    // Load the pages
    const MdxEngine = new MDXEngine(site.src(), options, format.engines[0]);
    site.loadPages(options.extensions, loader, MdxEngine);
  };
}
