import loader from "../loaders/text.js";
import { markdownIt, markdownItAttrs } from "../deps/markdown-it.js";
import hljs from "../deps/highlight.js";

export default function () {
  const markdown = markdownIt({
    html: true,
    highlight(str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(lang, str).value;
        } catch (__) {}
      }

      return "";
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
