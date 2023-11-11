import { read } from "../utils.ts";

import type { RawData } from "../file.ts";

/** Load binary files, like images, audio, video, etc. */
export default async function binary(path: string): Promise<RawData> {
  const content = await read(path, true);
  return { content };
}
