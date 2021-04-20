import {
  markdownIt,
  markdownItAttrs,
  markdownItDeflist,
  markdownItReplaceLinks,
} from "../deps/markdown-it.js";
import hljs from "../deps/highlight.js";
import Markdown from "../engines/markdown.js";
import { merge } from "../utils.js";

// Default options
const defaults = {
  extensions: [".md", ".markdown"],
  options: {
    html: true,
  },
  plugins: [
    markdownItAttrs,
    markdownItReplaceLinks,
    markdownItDeflist,
  ],
};

export default function (userOptions) {
  const options = merge(defaults, userOptions);

  return function (site) {
    const engine = createMarkdown(site, options);

    site.engine(options.extensions, new Markdown(site, engine));
    site.filter("md", filter);

    function filter(string, inline = false) {
      return inline
        ? engine.renderInline(string || "").trim()
        : engine.render(string || "").trim();
    }
  };
}

function createMarkdown(site, options) {
  const markdown = markdownIt({
    replaceLink(link) {
      return site.url(link);
    },
    highlight(code, language) {
      if (language && hljs.getLanguage(language)) {
        try {
          const html = hljs.highlight(code, { language, ignoreIllegals: true });
          return `<pre class="hljs"><code>${html.value}</code></pre>`;
        } catch {
          // Ignore error
        }
      }

      return `<pre><code>${markdown.utils.escapeHtml(code)}</code></pre>`;
    },
    ...options.options,
  });

  options.plugins.forEach((plugin) => markdown.use(plugin));

  return markdown;
}
