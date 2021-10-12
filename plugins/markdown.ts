import { Data, Engine, Helper, Site } from "../core.ts";
import {
  markdownIt,
  markdownItAttrs,
  markdownItDeflist,
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

export interface MarkdownItOptions {
  /** Set `true` to enable HTML tags in source */
  html?: boolean;

  /**
   * Use '/' to close single tags (<br />).
   * This is only for full CommonMark compatibility.
   */
  xhtmlOut?: boolean;

  /** Convert '\n' in paragraphs into <br> */
  breaks?: boolean;

  /**
   * CSS language prefix for fenced blocks.
   * Can be useful for external highlighters.
   */
  langPrefix?: string;

  /** Autoconvert URL-like text to links */
  linkify?: boolean;

  /** Enable some language-neutral replacement + quotes beautification */
  typographer?: boolean;

  /**
   * Double + single quotes replacement pairs, when typographer enabled,
   * and smartquotes on. Could be either a String or an Array.
   * For example, you can use '«»„“' for Russian, '„“‚‘' for German,
   * and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
   */
  quotes?: string | string[];

  /**
   * Highlighter function. Should return escaped HTML,
   * or '' if the source string is not changed and should be escaped externally.
   * If result starts with <pre... internal wrapper is skipped.
   */
  highlight?: (str: string, lang: string) => string | null;
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

  render(content: string, _data: Data, filename: string): string {
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
