import {
  markdownIt,
  markdownItAttrs,
  markdownItDeflist,
  MarkdownItOptions,
} from "../deps/markdown_it.ts";
import loader from "../core/loaders/text.ts";
import { merge } from "../core/utils.ts";

import type { Data, DeepPartial, Engine, Helper, Site } from "../core.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /** Options passed to markdown-it library */
  options: MarkdownItOptions;

  /** The list of markdown-it plugins to use */
  plugins: unknown[];

  /** To modify existing rules or new custom rules */
  // deno-lint-ignore no-explicit-any
  rules: Record<string, (...args: any[]) => any>;

  /** Set `true` append your plugins to the defaults */
  keepDefaultPlugins: boolean;
}

// Default options
export const defaults: Options = {
  extensions: [".md", ".markdown"],
  options: {
    html: true,
  },
  plugins: [
    markdownItAttrs,
    markdownItDeflist,
  ],
  rules: {},
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

  deleteCache() {}

  render(content: string, data?: Data, filename?: string): string {
    return this.renderSync(content, data, filename);
  }

  renderSync(content: unknown, data?: Data, filename?: string): string {
    if (typeof content !== "string") {
      content = String(content);
    }
    return this.engine.render(content as string, { filename, data });
  }

  addHelper() {}
}

/** Register the plugin to support Markdown */
export default function (userOptions?: DeepPartial<Options>) {
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

    // Hook to add markdown-it plugins
    site.hooks.addMarkdownItPlugin = (plugin, options) => {
      engine.use(plugin, options);
    };

    // Register custom rules
    for (const [name, rule] of Object.entries(options.rules)) {
      engine.renderer.rules[name] = rule;
    }

    // Hook to add custom rules
    site.hooks.addMarkdownItRule = (name, rule) => {
      engine.renderer.rules[name] = rule;
    };

    site.hooks.markdownIt = (callback) => callback(engine);

    // Load the pages
    site.loadPages(options.extensions, loader, new MarkdownEngine(engine));

    // Register the md filter
    site.filter("md", filter as Helper);

    function filter(string: string, inline = false): string {
      return inline
        ? engine.renderInline(string?.toString() || "").trim()
        : engine.render(string?.toString() || "").trim();
    }
  };
}
