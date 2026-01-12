import loader from "../core/loaders/text.ts";
import { merge } from "../core/utils/object.ts";
import { compile, remarkGfm } from "../deps/mdx.ts";
import { join, toFileUrl } from "../deps/path.ts";
import { renderComponent } from "../deps/ssx.ts";

import type Site from "../core/site.ts";
import type { Engine, Helper, HelperOptions } from "../core/renderer.ts";
import type { PluggableList, RehypeOptions } from "../deps/remark.ts";

export interface Options {
  /** File extensions to load */
  extensions?: string[];

  /** List of recma plugins to use */
  recmaPlugins?: PluggableList;

  /**
   * List of remark plugins to use
   * @default `[remarkGfm]`
   */
  remarkPlugins?: PluggableList;

  /** Options to pass to rehype */
  rehypeOptions?: RehypeOptions;

  /** List of rehype plugins to use */
  rehypePlugins?: PluggableList;

  /** Set `false` to remove the default plugins */
  useDefaultPlugins?: boolean;

  /** Components to add/override */
  components?: Record<string, unknown>;

  /**
   * Custom includes path
   * @default `site.options.includes`
   */
  includes?: string;
}

// Default options
export const defaults: Options = {
  extensions: [".mdx"],
  useDefaultPlugins: true,
};

const remarkDefaultPlugins = [
  remarkGfm,
];

/** Template engine to render Markdown files with Remark */
export class MDXEngine implements Engine<string | { toString(): string }> {
  baseUrl: string;
  options: Required<Options>;
  includes: string;
  filters: Record<string, Helper> = {};

  constructor(baseUrl: string, options: Required<Options>) {
    this.baseUrl = baseUrl;
    this.options = options;
    this.includes = options.includes;
  }

  deleteCache() {}

  async render(
    content: string,
    data?: Record<string, unknown>,
    filename?: string,
  ) {
    const baseUrl = toFileUrl(join(this.baseUrl, filename || "/")).href;
    const pragma = `/** @jsxImportSource lume */`;
    const result = await compile(content, {
      baseUrl,
      jsx: true,
      format: "mdx",
      outputFormat: "function-body",
      recmaPlugins: this.options.recmaPlugins,
      remarkPlugins: this.options.remarkPlugins,
      rehypePlugins: this.options.rehypePlugins,
      remarkRehypeOptions: this.options.rehypeOptions,
      stylePropertyNameCase: "css",
    });
    data ||= {};
    data.filters = this.filters;

    const destructure = `{${Object.keys(data!).join(",")}}`;
    const code = result.toString()
      .replace("/*@jsxRuntime automatic*/\n/*@jsxImportSource react*/", pragma)
      .replace(
        '"use strict";\n',
        `export default async function (${destructure}) {`,
      ) +
      "}";

    const url = URL.createObjectURL(new Blob([code], { type: "text/jsx" }));
    const module = (await import(url)).default;
    const mdxContext = (await module(data)).default;
    URL.revokeObjectURL(url);

    const body = mdxContext({
      components: { comp: data?.comp, ...this.options.components },
    });

    return renderComponent(body);
  }

  addHelper(name: string, fn: Helper, _options: HelperOptions) {
    this.filters[name] = fn;
  }
}

/**
 * A plugin to render MDX files
 * @see https://lume.land/plugins/mdx/
 */
export function mdx(userOptions?: Options) {
  return function (site: Site) {
    const options = merge(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );

    if (options.useDefaultPlugins) {
      options.remarkPlugins ||= [];
      options.remarkPlugins.unshift(...remarkDefaultPlugins);
    }

    const engine = new MDXEngine(site.src(), options);

    // Ignore includes folder
    if (options.includes) {
      site.ignore(options.includes);
    }

    // Load the pages and register the engine
    site.loadPages(options.extensions, {
      loader,
      engine,
    });

    // Register the filter
    const filter = async (
      content: string,
      data?: Record<string, unknown>,
    ): Promise<string> =>
      (await engine.render(content, data)).toString().trim();

    site.filter("mdx", filter, true);
  };
}

export default mdx;

/** Extends Helpers interface */
declare global {
  namespace Lume {
    export interface Helpers {
      /** @see https://lume.land/plugins/mdx/ */
      mdx: (content: string, data?: Record<string, unknown>) => Promise<string>;
    }
  }
}
