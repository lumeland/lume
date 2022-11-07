import { extract, test } from "../../deps/front_matter.ts";
import { read } from "../utils.ts";

import type { Data } from "../../core.ts";

/** Load a text file. Detect and parse the front matter */
export default async function text(path: string): Promise<Data> {
  const content = await read(path, false);

  if (test(content)) {
    const { attrs = {}, body } = extract<Data>(content);
    attrs.content = body;

    return attrs;
  }

  return { content };
}
