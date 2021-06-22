import { Data } from "../types.ts";

export default async function (path: string): Promise<Data> {
  const content = await Deno.readTextFile(path);
  return JSON.parse(content);
}
