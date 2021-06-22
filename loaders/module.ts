import { Data } from "../types.ts";

export default async function (path: string): Promise<Data> {
  const hash = Date.now();
  const mod: Record<string, unknown> = await import(`file://${path}#${hash}`);
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
