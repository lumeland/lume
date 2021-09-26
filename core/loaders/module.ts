import { Data } from "../../core.ts";
import { isPlainObject } from "../utils.ts";

/** Load a JavaScript/TypeScript file */
export default async function (path: string): Promise<Data> {
  const mod = await import(`file://${path}`);
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
