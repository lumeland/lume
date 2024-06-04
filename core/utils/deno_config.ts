import { parse } from "../../deps/jsonc.ts";
import { isUrl } from "../utils/path.ts";

/** Import map file */
export interface ImportMap {
  imports: Record<string, string>;
  scopes?: Record<string, Record<string, string>>;
}

/** Basic options for deno.json file */
export interface DenoConfig extends Partial<ImportMap> {
  importMap?: string;
  tasks?: Record<string, string>;
  compilerOptions?: {
    jsx?: "jsx" | "react-jsx" | "precompile";
    jsxImportSource?: string;
    types?: string[];
  };
  [key: string]: unknown;
}

export interface DenoConfigResult {
  file: string;
  config: DenoConfig;
  importMap?: ImportMap;
}

/** Detect and returns the Deno configuration */
export async function readDenoConfig(): Promise<DenoConfigResult | undefined> {
  for (const file of ["deno.json", "deno.jsonc"]) {
    try {
      const content = await Deno.readTextFile(file);
      const config = parse(content) as DenoConfig;
      let importMap: ImportMap | undefined;

      if (config.importMap) {
        importMap = isUrl(config.importMap)
          ? await (await fetch(config.importMap)).json()
          : await JSON.parse(await Deno.readTextFile(config.importMap));
      } else if (config.imports) {
        importMap = {
          imports: config.imports,
          scopes: config.scopes,
        };
      }
      return { file, config, importMap };
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        continue;
      }

      throw err;
    }
  }
}
