import { parseFrontmatter } from "./yaml.js";

export default async function (path: string): Promise<Record<string, unknown>> {
  const content = await Deno.readTextFile(path);
  return parseFrontmatter(content);
}
