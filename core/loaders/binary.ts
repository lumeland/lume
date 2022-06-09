import type { Data } from "../../core.ts";
import { read } from "../utils.ts";

/** Load binary files, like images, audio, video, etc. */
export default async function binary(path: string): Promise<Data> {
  const content = await read(path, true);
  return { content };
}
