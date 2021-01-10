import { parseFrontmatter } from "./yaml.js";
import { readFile } from "../utils.js";

export default async function (path) {
  return readFile(path, (content) => parseFrontmatter(content));
}
