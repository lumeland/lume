import { Data } from "../../core.ts";

/** Load a JavaScript/TypeScript file. Use a random hash to prevent caching */
export default async function (path: string): Promise<Data> {
  const hash = Date.now();
  const mod = await import(`file://${path}#${hash}`);
  const data: Data = {};

  for (const [name, value] of Object.entries(mod)) {
    if (name === "default") {
      switch (typeof value) {
        case "string":
        case "function":
          data.content = value;
          break;
        default:
          Object.assign(data, value);
      }

      continue;
    }

    data[name] = value;
  }

  return data;
}
