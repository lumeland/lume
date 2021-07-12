import { Data } from "../../core.ts";

/** Load and parse a JSON file */
export default async function (path: string): Promise<Data> {
  const content = await Deno.readTextFile(path);
  return JSON.parse(content);
}
