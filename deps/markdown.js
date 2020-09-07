import markdownIt from "https://dev.jspm.io/markdown-it";
import markdownItAttrs from "https://dev.jspm.io/markdown-it-attrs";
import hljs from "./highlight.js";

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

export default markdown;
