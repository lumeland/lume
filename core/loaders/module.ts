import { Data } from "../../core.ts";
import { isPlainObject } from "../utils.ts";

const bundle = "deno:///bundle.js";
const fileProtocol = "file://";

interface SourceMap {
  version: number;
  sources: string[];
  names: unknown[];
  mappings: string;
}

/** Load a JavaScript/TypeScript file. Use a Deno.emit to prevent caching */
export default async function (path: string): Promise<Data> {
  const result = await Deno.emit(path, { bundle: "module" });
  const deps = getDependencies(path, result);
  const mod = await executeModule(result);
  const data: Data = { dependencies: deps };

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

function getDependencies(path: string, result: Deno.EmitResult) {
  const { sources } = JSON.parse(result.files[`${bundle}.map`]) as SourceMap;
  const filePath = `${fileProtocol}${path}`;

  return sources
    .filter((x) => x !== filePath && x.startsWith(fileProtocol))
    .map((x) => x.substr(fileProtocol.length));
}

function executeModule(result: Deno.EmitResult) {
  const code = result.files[bundle] as string;
  const metadata = "data:application/javascript;charset=utf-8";
  const encoded = `${metadata},${encodeURIComponent(code)}`;
  return import(encoded);
}
