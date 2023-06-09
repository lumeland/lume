import { parse } from "../../deps/jsonc.ts";
import { isPlainObject, read } from "../utils.ts";

import type { Data } from "../../core.ts";

/** Load and parse a JSON / JSONC file */
export default async function json(path: string): Promise<Data> {
  const text = await read(path, false);
  const content = path.endsWith(".jsonc") ? parse(text) : JSON.parse(text);

  if (!content) {
    return {};
  }

  if (isPlainObject(content)) {
    return content as Data;
  }

  return { content };
}
