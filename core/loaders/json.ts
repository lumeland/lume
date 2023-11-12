import { parse } from "../../deps/jsonc.ts";
import { isPlainObject } from "../utils/object.ts";
import { read } from "../utils/read.ts";

import type { RawData } from "../file.ts";

/** Load and parse a JSON / JSONC file */
export default async function json(path: string): Promise<RawData> {
  const text = await read(path, false);
  const content = path.endsWith(".jsonc") ? parse(text) : JSON.parse(text);

  if (!content) {
    return {};
  }

  if (isPlainObject(content)) {
    return content as RawData;
  }

  return { content };
}
