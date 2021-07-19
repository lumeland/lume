import { Data } from "../../core.ts";

/** Load binary files, like images, audio, video, etc. */
export default async function (path: string): Promise<Data> {
  const content = await Deno.readFile(path);
  return { content };
}
