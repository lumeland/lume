import { isPlainObject } from "../utils.ts";

import type { Data } from "../../core.ts";

/** Load and parse a JSON file */
export default async function json(path: string): Promise<Data> {
  const text = await Deno.readTextFile(path);
  const content = JSON.parse(text);

  if (!content) {
    return {};
  }

  if (isPlainObject(content)) {
    return content as Data;
  }

  return { content };
}
