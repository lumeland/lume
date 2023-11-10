import { parse } from "../../deps/yaml.ts";
import { isPlainObject, read } from "../utils.ts";

import type { Data } from "../file.ts";

/** Load and parse a YAML file */
export default async function yaml(path: string): Promise<Data> {
  const text = await read(path, false);
  const content = parse(text);

  if (!content) {
    return {};
  }

  if (isPlainObject(content)) {
    return content as Data;
  }

  return { content };
}
