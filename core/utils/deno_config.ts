import { brightGreen, gray } from "../../deps/colors.ts";
import { dirname, extname, join } from "../../deps/path.ts";
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

/** Write the Deno configuration file */
export async function writeDenoConfig(options: DenoConfigResult) {
  const { file, config, importMap } = options;

  if (importMap && !config.importMap) {
    config.imports = importMap.imports;
    config.scopes = importMap.scopes;
  }

  if (config.importMap) {
    const importMapFile = join(dirname(file), config.importMap);
    await Deno.writeTextFile(
      importMapFile,
      JSON.stringify(importMap, null, 2) + "\n",
    );
    console.log(brightGreen("Import map file saved:"), importMapFile);
  }

  if (extname(file) === ".jsonc") {
    const save = confirm(
      "Saving the deno.jsonc file will overwrite the comments. Continue?",
    );

    if (!save) {
      console.log(
        "You have to update your deno.jsonc file manually with the following content:",
      );
      console.log(gray(JSON.stringify(config, null, 2)));
      console.log("Use deno.json to update it automatically without asking.");
      return;
    }
  }
  await Deno.writeTextFile(file, JSON.stringify(config, null, 2) + "\n");
  console.log("Deno configuration file saved:", gray(file));
}

/** Update the Lume import map and tasks in the Deno configuration file */
export function updateLumeVersion(url: URL, denoConfig: DenoConfigResult) {
  denoConfig.importMap ??= { imports: {} };

  const { config, importMap } = denoConfig;

  const oldUrl = importMap.imports["lume/"];
  const newUrl = new URL("./", url).href;
  importMap.imports["lume/"] = newUrl;

  for (const [specifier, url] of Object.entries(importMap.imports)) {
    if (url.startsWith(oldUrl)) {
      importMap.imports[specifier] = url.replace(oldUrl, newUrl);
    }
  }

  // Configure lume tasks
  const tasks = config.tasks || {};
  if (!tasks.lume || !tasks.lume.includes(`echo "import 'lume/cli.ts'"`)) {
    tasks.lume = `echo "import 'lume/cli.ts'" | deno run -A -`;
    tasks.build = "deno task lume";
    tasks.serve = "deno task lume -s";
  }
  config.tasks = tasks;

  // Configure the compiler options
  const compilerOptions = config.compilerOptions || {};
  compilerOptions.types = compilerOptions.types || [];
  if (!compilerOptions.types.includes("lume/types.ts")) {
    compilerOptions.types.push("lume/types.ts");
  }
  config.compilerOptions = compilerOptions;
}
