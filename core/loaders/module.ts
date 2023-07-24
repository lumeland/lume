import { isPlainObject, isUrl } from "../utils.ts";

import type { Data } from "../../core.ts";

const cached = new Set<string>();

/** Load a JavaScript/TypeScript file. Use a random hash to prevent caching */
export default async function module(path: string): Promise<Data> {
  const url = isUrl(path) ? path : `file://${path}`;
  const specifier = cached.has(url) ? `${url}#${Date.now()}` : url;
  const mod = await import(specifier);
  return toData(mod);
}

/** Transform the imported module to Data */
export function toData(mod: Record<string, unknown>): Data {
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
