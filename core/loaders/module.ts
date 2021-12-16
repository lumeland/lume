import { isPlainObject } from "../utils.ts";

import type { Data } from "../filesystem.ts";

/** Load a JavaScript/TypeScript file. Use a random hash to prevent caching */
export default async function (path: string): Promise<Data> {
  const hash = Date.now();
  const mod = await import(`file://${path}#${hash}`);
  const data: Data = {};

  for (const [name, value] of Object.entries(mod)) {
    if (name === "default") {
      if (isPlainObject(value)) {
        Object.assign(data, value);
      } else {
        data.content = value;
      }
      continue;
    }

    data[name] = value;
  }

  return data;
}
