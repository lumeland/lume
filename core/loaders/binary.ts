import { read } from "../utils.ts";

import type { Data } from "../filesystem.ts";

/** Load binary files, like images, audio, video, etc. */
export default async function binary(path: string): Promise<Data> {
  const content = await read(path, true);
  return { content };
}
