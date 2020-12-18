import Markdown from "../engines/markdown.js";

export default function () {
  return function (site) {
    const markdown = new Markdown(site);

    site.engine([".md", ".markdown"], markdown);
    site.filter("md", filter);

    function filter(string, inline = false) {
      return inline
        ? markdown.engine.renderInline(string || "").trim()
        : markdown.engine.render(string || "").trim();
    }
  };
}
