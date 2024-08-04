import {
  markdownIt,
  markdownItAttrs,
  markdownItDeflist,
  MarkdownItOptions,
} from "../deps/markdown_it.ts";
import loader from "../core/loaders/text.ts";
import { merge } from "../core/utils/object.ts";

import type Site from "../core/site.ts";
import type { Engine } from "../core/renderer.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions?: string[];

  /** Options passed to markdown-it library */
  options?: MarkdownItOptions;

  /**
   * The list of markdown-it plugins to use
   * @default `[markdownItAttrs, markdownItDeflist]`
   */
  plugins?: unknown[];

  /** To modify existing rules or new custom rules */
  // deno-lint-ignore no-explicit-any
  rules?: Record<string, (...args: any[]) => any>;

  /** Set `false` to remove the default plugins */
  useDefaultPlugins?: boolean;
}

// Default options
export const defaults: Options = {
  extensions: [".md", ".markdown"],
  options: {
    html: true,
  },
  plugins: [],
  rules: {},
  useDefaultPlugins: true,
};

const defaultPlugins = [
  markdownItAttrs,
  markdownItDeflist,
];

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

  render(
    content: string,
    data?: Record<string, unknown>,
    filename?: string,
  ): string {
    return this.renderComponent(content, data, filename);
  }

  renderComponent(
    content: unknown,
    data?: Record<string, unknown>,
    filename?: string,
  ): string {
    if (typeof content !== "string") {
      content = String(content);
    }
    return this.engine.render(content as string, { filename, data });
  }

  addHelper() {}
}

/**
 * A plugin to render Markdown files using markdown-it
 * Installed by default
 * @see https://lume.land/plugins/markdown
 */
export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);

  if (options.useDefaultPlugins) {
    options.plugins.unshift(...defaultPlugins);
  }

  return function (site: Site) {
    const engine = markdownIt(options.options);

    // Disable indented code blocks by default
    engine.disable("code");

    // Register markdown-it plugins
    options.plugins.forEach((plugin) =>
      Array.isArray(plugin) ? engine.use(...plugin) : engine.use(plugin)
    );

    // Hook to add markdown-it plugins
    site.hooks.addMarkdownItPlugin = (plugin, ...options) => {
      engine.use(plugin, ...options);
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
    site.loadPages(options.extensions, {
      loader,
      engine: new MarkdownEngine(engine),
    });

    // Register the md filter
    site.filter("md", filter);

    function filter(string: string, inline = false): string {
      return inline
        ? engine.renderInline(string?.toString() || "").trim()
        : engine.render(string?.toString() || "").trim();
    }
  };
}

/** Extends Helpers interface */
declare global {
  namespace Lume {
    export interface Helpers {
      /** @see https://lume.land/plugins/markdown/ */
      md: (string: string, inline?: boolean) => string;
    }
  }
}
