import loader from "../core/loaders/text.ts";
import { merge } from "../core/utils.ts";
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
import type { Data } from "../core/filesystem.ts";

export interface Options {
  /** List of extensions this plugin applies to */
  extensions?: string[];

  /**
   * List of remark plugins to use
   * @default `[remarkGfm]`
   */
  remarkPlugins?: unknown[];

  /** List of rehype plugins to use */
  rehypePlugins?: unknown[];

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
    data?: Data,
    filename?: string,
  ): Promise<string> {
    return (await this.engine.process({
      value: content,
      data: data?.page?.data,
      path: filename,
    })).toString();
  }

  renderComponent(content: string, data?: Data, filename?: string): string {
    return this.engine.processSync({
      value: content,
      data: data?.page?.data,
      path: filename,
    }).toString();
  }

  addHelper() {}
}

/** Register the plugin to support Markdown */
export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return function (site: Site) {
    // @ts-ignore: This expression is not callable
    const engine = unified.unified();

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
    plugins.push([remarkRehype, { allowDangerousHtml: true }]);

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
    site.filter("md", filter as Helper);

    function filter(content: string): string {
      return remarkEngine.renderComponent(content).trim();
    }
  };
}
