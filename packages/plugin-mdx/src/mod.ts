import loader from "@lumeland/core/loaders/text.ts";
import { Merge, merge } from "@lumeland/core/utils/object.ts";
import { compile, remarkGfm, run } from "../deps/mdx.ts";
import { join, toFileUrl } from "../deps/path.ts";
import { renderComponent, Fragment, jsx } from "../deps/ssx.ts";
import { propsToRootScope } from "./utils/recma-props.ts";

import type Site from "@lumeland/core/site.ts";
import type { Engine, Helper, HelperOptions } from "@lumeland/core/renderer.ts";
import type { PluggableList, RehypeOptions } from "../deps/mdx.ts";

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
export const defaults = {
  extensions: [".mdx"],
  useDefaultPlugins: true,
  includes: "", // Will be overwritten
} satisfies Options;

const remarkDefaultPlugins = [remarkGfm];

/** Template engine to render Markdown files with Remark */
export class MDXEngine implements Engine<string | { toString(): string }> {
  baseUrl: string;
  options: Merge<Options, typeof defaults>;
  includes: string;
  filters: Record<string, Helper> = {};

  constructor(baseUrl: string, options: Merge<Options, typeof defaults>) {
    this.baseUrl = baseUrl;
    this.options = options;
    this.includes = options.includes;
  }

  deleteCache() {}

  async render(content: string, data?: Record<string, unknown>, filename?: string) {
    data ||= {};
    data.filters = this.filters;
    const { comp, ...extraData } = data;

    const baseUrl = toFileUrl(join(this.baseUrl, filename || "/")).href;
    const result = await compile(content, {
      baseUrl,
      jsx: false,
      format: "mdx",
      outputFormat: "function-body",
      recmaPlugins: [
        ...(this.options.recmaPlugins ?? []),
        [propsToRootScope, { names: Object.keys(extraData) }],
      ],
      remarkPlugins: this.options.remarkPlugins,
      rehypePlugins: this.options.rehypePlugins,
      remarkRehypeOptions: this.options.rehypeOptions,
      stylePropertyNameCase: "css",
    });

    const mod = await run(result, {
      Fragment,
      jsx,
      jsxs: jsx,
      baseUrl,
    });

    const body = mod.default({
      components: { comp: comp as any, ...this.options.components },
      ...extraData,
    });

    return renderComponent(body);
  }

  addHelper(name: string, fn: Helper, options: HelperOptions) {
    if (options.type === "filter") {
      this.filters[name] = fn;
    }
  }
}

/**
 * A plugin to render MDX files
 * @see https://lume.land/plugins/mdx/
 */
export function mdx(userOptions?: Options) {
  return function (site: Site) {
    const options = merge({ ...defaults, includes: site.options.includes }, userOptions);

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
    const filter = async (content: string, data?: Record<string, unknown>): Promise<string> =>
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
