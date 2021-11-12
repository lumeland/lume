import { encode } from "./deps/base64.ts";
import { posix } from "./deps/path.ts";
import { parse } from "./deps/flags.ts";
import { Exception } from "./core/utils.ts";

const { join } = posix;
const baseUrl = new URL(".", import.meta.url).href;

interface ImportMap {
  imports: Record<string, string>;
  scopes?: Record<string, Record<string, string>>;
}

/**
 * Return a data url with the import map of Lume
 * Optionally merge it with a custom import map from the user
 */
export async function getImportMap(mapFile?: string) {
  const map: ImportMap = {
    imports: {
      "lume": join(baseUrl, "/mod.ts"),
      "lume/": join(baseUrl, "/"),
      "https://deno.land/x/lume/": join(baseUrl, "/"),
    },
  };

  if (mapFile) {
    try {
      const file = await (await fetch(mapFile)).text();
      const parsedMap = JSON.parse(file) as ImportMap;
      map.imports = { ...map.imports, ...parsedMap.imports };
      map.scopes = parsedMap.scopes;
    } catch (cause) {
      throw new Exception("Unable to load the import map file", {
        cause,
        mapFile,
      });
    }
  }

  return `data:application/json;base64,${encode(JSON.stringify(map))}`;
}

/** Returns the Lume & Deno arguments */
export async function getArgs(args: string[]): Promise<[string[], string[]]> {
  const sep = args.indexOf("--");
  const lumeArgs = sep === -1 ? args : args.slice(0, sep);
  const denoArgs = [
    "--unstable",
    "-A",
    `--no-check`,
  ];

  if (lumeArgs.includes("--quiet")) {
    denoArgs.push("--quiet");
  }

  // Deno flags
  const parsedArgs = parse(sep === -1 ? [] : args.slice(sep + 1));

  // Regular flags
  for (const [name, value] of Object.entries(parsedArgs)) {
    switch (name) {
      case "_":
      case "import-map":
        break;

      default: {
        const flagName = name.length === 1 ? `-${name}` : `--${name}`;
        denoArgs.push(value === true ? flagName : `${flagName}=${value}`);
      }
    }
  }

  // Merge the import map
  denoArgs.push(`--import-map=${await getImportMap(parsedArgs["import-map"])}`);

  return [lumeArgs, denoArgs];
}

export default async function main(args: string[]) {
  const [lumeArgs, denoArgs] = await getArgs(args);

  const cli = join(baseUrl, "./cli.ts");
  const process = Deno.run({
    cmd: [
      Deno.execPath(),
      "run",
      ...denoArgs,
      cli,
      ...lumeArgs,
    ],
  });

  const status = await process.status();
  process.close();

  if (!status.success) {
    addEventListener("unload", () => Deno.exit(1));
  }
}

// Run the current command
if (import.meta.main) {
  main(Deno.args);
}
