import loader from "../core/loaders/text.ts";
import { merge } from "../core/utils/object.ts";
import {
  rehypeRaw,
  rehypeSanitize,
  rehypeStringify,
  remarkGfm,
  remarkParse,
  remarkRehype,
  unified,
} from "../deps/remark.ts";

import type Site from "../core/site.ts";
import type { Engine, Helper } from "../core/renderer.ts";
import type { Page } from "../core/file.ts";
import type { PluggableList, RehypeOptions } from "../deps/remark.ts";

export interface Options {
  /** List of extensions this plugin applies to */
  extensions?: string[];

  /**
   * List of remark plugins to use
   * @default `[remarkGfm]`
   */
  remarkPlugins?: PluggableList;

  /** Options to pass to rehype */
  rehypeOptions?: RehypeOptions;

  /** List of rehype plugins to use */
  rehypePlugins?: PluggableList;

  /** Flag to turn on HTML sanitization to prevent XSS */
  sanitize?: boolean;

  /** Set `false` to remove the default plugins */
  useDefaultPlugins?: boolean;
}

// Default options
export const defaults: Options = {
  extensions: [".md"],
  sanitize: false,
  useDefaultPlugins: true,
  rehypeOptions: {
    allowDangerousHtml: true,
  },
};

const remarkDefaultPlugins = [
  remarkGfm,
];

/** Template engine to render Markdown files with Remark */
export class MarkdownEngine implements Engine {
  engine: unified.Processor;

  constructor(engine: unified.Processor) {
    this.engine = engine;
  }

  deleteCache() {}

  async render(
    content: string,
    data?: Record<string, unknown>,
    filename?: string,
  ): Promise<string> {
    const page = data?.page as Page | undefined;
    return (await this.engine.process({
      value: content,
      data: page?.data,
      path: filename,
    })).toString();
  }

  renderComponent(
    content: string,
    data?: Record<string, unknown>,
    filename?: string,
  ): string {
    const page = data?.page as Page | undefined;
    return this.engine.processSync({
      value: content,
      data: page?.data,
      path: filename,
    }).toString();
  }

  addHelper() {}
}

/**
 * A plugin to load all Markdown files and process them using Remark
 * @see https://lume.land/plugins/remark/
 */
export function remark(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const plugins = [];

    // Add remark-parse to generate MDAST
    plugins.push(remarkParse);

    if (options.useDefaultPlugins) {
      options.remarkPlugins ??= [];
      options.remarkPlugins.unshift(...remarkDefaultPlugins);
    }

    // Add remark plugins
    plugins.push(...options.remarkPlugins);

    // Add remark-rehype to generate HAST
    plugins.push([remarkRehype, options.rehypeOptions ?? {}]);

    if (options.sanitize) {
      // Add rehype-raw to convert raw HTML to HAST
      plugins.push(rehypeRaw);
    }

    // Add rehype plugins
    plugins.push(...options.rehypePlugins ?? []);

    if (options.sanitize) {
      // Add rehype-sanitize to make sure HTML is safe
      plugins.push(rehypeSanitize);
      // Add rehype-stringify to output HTML ignoring raw HTML nodes
      plugins.push(rehypeStringify);
    } else {
      // Add rehype-stringify to output HTML
      plugins.push([rehypeStringify, { allowDangerousHtml: true }]);
    }

    const engine = unified.unified();

    // Register all plugins
    // @ts-ignore: let unified take care of loading all the plugins
    engine.use(plugins);

    // Load the pages
    const remarkEngine = new MarkdownEngine(engine);
    site.loadPages(options.extensions, {
      loader,
      engine: remarkEngine,
    });

    // Register the filter
    site.filter("md", filter as Helper, true);

    async function filter(content: string): Promise<string> {
      return (await remarkEngine.render(content)).trim();
    }
  };
}

export default remark;
