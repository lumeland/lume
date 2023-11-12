import { isUrl } from "../utils/path.ts";
import { isPlainObject } from "../utils.ts";

import type { RawData } from "../file.ts";

/** Load a JavaScript/TypeScript file. Use a random hash to prevent caching */
export default async function module(path: string): Promise<RawData> {
  const url = isUrl(path) ? path : `file://${path}`;
  const specifier = Deno.env.get("LUME_LIVE_RELOAD") === "true"
    ? `${url}#${Date.now()}`
    : url;

  const mod = await import(specifier);
  return toData(mod);
}

/** Transform the imported module to RawData */
export function toData(mod: Record<string, unknown>): RawData {
  const data: RawData = {};

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
