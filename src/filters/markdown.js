import markdown from "../../deps/markdown.js";

export default function () {
  return function (string, inline = false) {
    return inline
      ? markdown.renderInline(string || "").trim()
      : markdown.render(string || "").trim();
  };
}
