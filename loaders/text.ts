import { Data } from "../types.ts";
import { parseFrontmatter } from "./yaml.ts";

/**
 * Load text files. It detects and parse the front matter.
 */
export default async function (path: string): Promise<Data> {
  const content = await Deno.readTextFile(path);
  return parseFrontmatter(content);
}
