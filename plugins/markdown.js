import loader from "../loaders/text.js";
import { markdownIt, markdownItAttrs } from "../deps/markdown-it.js";
import hljs from "../deps/highlight.js";

export default function () {
  const markdown = markdownIt({
    html: true,
    highlight(str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          const code = hljs.highlight(lang, str, true).value;
          return `<pre class="hljs"><code>${code}</code></pre>`;
        } catch (__) {
          //Ignore error
        }
      }

      return `<pre class="hljs"><code>${
        markdown.utils.escapeHtml(str)
      }</code></pre>`;
    },
  }).use(markdownItAttrs);

  return (site) => {
    site.load([".md", ".markdown"], loader);
    site.beforeRender([".md", ".markdown"], transform);
    site.filter("md", filter);
  };

  function transform(page) {
    if (page.content) {
      page.content = markdown.render(page.content);
    }
  }

  function filter(string, inline = false) {
    return inline
      ? markdown.renderInline(string || "").trim()
      : markdown.render(string || "").trim();
  }
}
