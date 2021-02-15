import { parseFrontmatter } from "./yaml.js";

export default function (path, source) {
  return source.readFile(path, (content) => parseFrontmatter(content));
}
