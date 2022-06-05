import { parseFrontMatter } from "./yaml.ts";
import { read } from "../utils.ts";

import type { Data } from "../../core.ts";

/** Load a text file. Detect and parse the front matter */
export default async function text(path: string): Promise<Data> {
  const content = await read(path, false);
  return parseFrontMatter(content, path);
}
