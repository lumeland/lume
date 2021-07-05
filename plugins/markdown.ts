import Site from "../site.ts";
import { Helper } from "../types.ts";
import {
  markdownIt,
  markdownItAttrs,
  markdownItDeflist,
  markdownItReplaceLink,
} from "../deps/markdown_it.ts";
import loader from "../loaders/text.ts";
import Markdown from "../engines/markdown.ts";
import { merge } from "../utils.ts";

export interface Options {
  extensions: string[];
  options: Partial<MarkdownItOptions>;
  plugins: unknown[];
}

export interface MarkdownItOptions {
  html?: boolean;
  xhtmlOut?: boolean;
  breaks?: boolean;
  langPrefix?: string;
  linkify?: boolean;
  typographer?: boolean;
  quotes?: string | string[];
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
    markdownItReplaceLink,
  ],
};

/**
 * This plugin add support for markdown
 */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return function (site: Site) {
    const engine = createMarkdown(site, options);

    site.loadPages(options.extensions, loader, new Markdown(site, engine));
    site.filter("md", filter as Helper);

    function filter(string: string, inline = false): string {
      return inline
        ? engine.renderInline(string || "").trim()
        : engine.render(string || "").trim();
    }
  };
}

function createMarkdown(site: Site, options: Options) {
  // @ts-ignore: This expression is not callable.
  const markdown = markdownIt({
    replaceLink(link: string) {
      return site.url(link);
    },
    ...options.options,
  });

  options.plugins.forEach((plugin) =>
    Array.isArray(plugin) ? markdown.use(...plugin) : markdown.use(plugin)
  );

  return markdown;
}
