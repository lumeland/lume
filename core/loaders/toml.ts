import { parse } from "../../deps/toml.ts";
import { isPlainObject } from "../utils/object.ts";
import { read } from "../utils/read.ts";

import type { RawData } from "../file.ts";

/** Load and parse a TOML file */
export default async function toml(path: string): Promise<RawData> {
  const text = await read(path, false);
  const content = parse(text);

  if (!content) {
    return {};
  }

  if (isPlainObject(content)) {
    return content as RawData;
  }

  return { content };
}
