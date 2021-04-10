import {
  markdownIt,
  markdownItAttrs,
  markdownItDeflist,
  markdownItReplaceLinks,
} from "../deps/markdown-it.js";
import hljs from "../deps/highlight.js";
import TemplateEngine from "./templateEngine.js";

export default class Markdown extends TemplateEngine {
  constructor(site, options = {}) {
    super(site, options);
    this.engine = createMarkdown(site);
  }

  render(content) {
    return this.engine.render(content);
  }
}

function createMarkdown(site) {
  const markdown = markdownIt({
    html: true,
    replaceLink(link) {
      return site.url(link);
    },
    highlight(str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          const options = { language: lang, ignoreIllegals: true };
          const code = hljs.highlight(str, options).value;
          return `<pre class="hljs"><code>${code}</code></pre>`;
        } catch (__) {
          // Ignore error
        }
      }

      return `<pre class="hljs"><code>${
        markdown.utils.escapeHtml(str)
      }</code></pre>`;
    },
  })
    .use(markdownItAttrs)
    .use(markdownItReplaceLinks)
    .use(markdownItDeflist);

  return markdown;
}
