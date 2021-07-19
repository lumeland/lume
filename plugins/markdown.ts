import { Helper, Site } from "../core.ts";
import {
  markdownIt,
  markdownItAttrs,
  markdownItDeflist,
  markdownItReplaceLink,
} from "../deps/markdown_it.ts";
import loader from "../core/loaders/text.ts";
import Markdown from "../core/engines/markdown.ts";
import { merge } from "../core/utils.ts";

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

/** A plugin to add support for Markdown */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return function (site: Site) {
    const engine = createMarkdown(site, options);

    site.loadPages(options.extensions, loader, new Markdown(engine));
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
