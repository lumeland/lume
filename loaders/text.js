import { parseFrontmatter } from "./yaml.js";

export default async function loadText(path) {
  const content = await Deno.readTextFile(path);
  return parseFrontmatter(content);
}
