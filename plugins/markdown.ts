import {
  markdownIt,
  markdownItAttrs,
  markdownItDeflist,
  markdownItReplaceLink,
} from "../deps/markdown_it.ts";
import loader from "../loaders/text.ts";
import Markdown from "../engines/markdown.ts";
import { merge } from "../utils.ts";
import Site from "../site.ts";
import { Helper } from "../types.ts";

interface Options {
  extensions: string[];
  options: MarkdownItOptions;
  plugins: unknown[];
}

interface MarkdownItOptions {
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

export default function (userOptions: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return function (site: Site) {
    const engine = createMarkdown(site, options);

    site.loadPages(options.extensions, loader, new Markdown(site, engine));
    site.filter("md", filter as Helper);

    function filter(string: string, inline = false) {
      return inline
        ? engine.renderInline(string || "").trim()
        : engine.render(string || "").trim();
    }
  };
}

function createMarkdown(site: Site, options: Options) {
  const markdown = markdownIt({
    replaceLink(link: string) {
      return site.url(link);
    },
    ...options.options,
  });

  options.plugins.forEach((plugin) => markdown.use(plugin));

  return markdown;
}
