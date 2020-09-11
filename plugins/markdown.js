import loader from "../loaders/text.js";
import markdown from "../../deps/markdown.js";
import permalink from "../transformers/permalink.js";

export default function () {
  return (site) => {
    site.load([".md", ".markdown"], loader);
    site.beforeRender([".md", ".markdown"], transform);
    site.beforeRender([".md"], permalink);
    site.filter(["md"], filter);
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
