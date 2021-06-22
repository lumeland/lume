import { Data } from "../types.ts";
import { parseFrontmatter } from "./yaml.ts";

export default async function (path: string): Promise<Data> {
  const content = await Deno.readTextFile(path);
  return parseFrontmatter(content);
}
