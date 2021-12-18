import { parseFrontMatter } from "./yaml.ts";

import type { Data } from "../../core.ts";

/** Load a text file. Detect and parse the front matter */
export default async function (path: string): Promise<Data> {
  const content = await Deno.readTextFile(path);
  return parseFrontMatter(content);
}
