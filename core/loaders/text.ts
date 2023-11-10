import { extract, test } from "../../deps/front_matter.ts";
import { read } from "../utils.ts";

import type { Data } from "../filesystem.ts";

/** Load a text file. Detect and parse the front matter */
export default async function text(path: string): Promise<Data> {
  const content = await read(path, false);

  if (test(content)) {
    let { attrs, body } = extract<Data>(content);
    attrs ??= {};
    attrs.content = body;

    return attrs;
  }

  return { content };
}
