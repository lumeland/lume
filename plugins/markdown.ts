import { Data, Engine, Helper, Site } from "../core.ts";
import {
  markdownIt,
  markdownItAttrs,
  markdownItDeflist,
  MarkdownItOptions,
} from "../deps/markdown_it.ts";
import loader from "../core/loaders/text.ts";
import { merge } from "../core/utils.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /** Options passed to markdown-it library */
  options: Partial<MarkdownItOptions>;

  /** The list of markdown-it plugins to use */
  plugins: unknown[];

  /** Set `true` append your plugins to the defaults */
  keepDefaultPlugins: boolean;
}

// Default options
const defaults: Options = {
  extensions: [".md"],
  options: {
    html: true,
  },
  plugins: [
    markdownItAttrs,
    markdownItDeflist,
  ],
  keepDefaultPlugins: false,
};

interface MarkdownItEngine {
  render: (input: string, env?: Record<string, unknown>) => string;
}

/** Template engine to render Markdown files */
export class MarkdownEngine implements Engine {
  engine: MarkdownItEngine;

  constructor(engine: MarkdownItEngine) {
    this.engine = engine;
  }

  render(content: string, data?: Data, filename?: string): string {
    return this.renderSync(content, data, filename);
  }

  renderSync(content: string, _data?: Data, filename?: string): string {
    return this.engine.render(content, { filename });
  }

  addHelper() {}
}

/** Register the plugin to support Markdown */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  if (options.keepDefaultPlugins && userOptions?.plugins?.length) {
    options.plugins = defaults.plugins.concat(userOptions.plugins);
  }

  return function (site: Site) {
    // @ts-ignore: This expression is not callable.
    const engine = markdownIt(options.options);

    // Register markdown-it plugins
    options.plugins.forEach((plugin) =>
      Array.isArray(plugin) ? engine.use(...plugin) : engine.use(plugin)
    );

    // Load the pages
    site.loadPages(options.extensions, loader, new MarkdownEngine(engine));

    // Register the md filter
    site.filter("md", filter as Helper);

    function filter(string: string, inline = false): string {
      return inline
        ? engine.renderInline(string || "").trim()
        : engine.render(string || "").trim();
    }
  };
}
