import { parseFrontmatter } from "./yaml.js";

export default async function (path, source) {
  return source.readFile(path, (content) => parseFrontmatter(content));
}
