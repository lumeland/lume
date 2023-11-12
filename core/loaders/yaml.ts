import { parse } from "../../deps/yaml.ts";
import { isPlainObject } from "../utils.ts";
import { read } from "../utils/read.ts";

import type { RawData } from "../file.ts";

/** Load and parse a YAML file */
export default async function yaml(path: string): Promise<RawData> {
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
