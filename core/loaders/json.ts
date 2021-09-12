import { Data } from "../../core.ts";
import { isPlainObject } from "../utils.ts";

/** Load and parse a JSON file */
export default async function (path: string): Promise<Data> {
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
