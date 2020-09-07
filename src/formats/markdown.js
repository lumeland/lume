import loadText from "./text.js";
import markdown from "../../deps/markdown.js";

export default async function loadMarkdown(path) {
  const data = await loadText(path);

  if (data.content) {
    data.content = markdown.render(data.content);
  }

  return data;
}
