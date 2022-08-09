import { encode } from "./deps/base64.ts";
import { parse } from "./deps/flags.ts";
import { cyan, dim, green, red } from "./deps/colors.ts";
import {
  checkDenoVersion,
  getDenoConfig,
  getImportMap,
  getLumeVersion,
  loadImportMap,
  mustNotifyUpgrade,
  toUrl,
} from "./core/utils.ts";
import { log } from "./cli/utils.ts";

/**
 * This file works as a proxy to the actual Lume CLI to fix the following issues:
 * - Add defaults flags to Deno (--unstable, -A, --no-check)
 * - Adds user provided flags to Deno (for example --compact)
 * - Detect and set the lume --quiet flag in Deno.
 * - Detect and use the deno.json file automatically.
 * - Add the import-map option to Deno if it's missing
 * - Check whether the import_map.json file has the Lume imports.
 * - Check whether the Lume version is the latest.
 */

/** Returns the Lume & Deno arguments */
export async function getArgs(
  args: string[],
  quiet: boolean,
): Promise<[string[], string[]]> {
  const sep = args.indexOf("--");
  const lumeArgs = sep === -1 ? args : args.slice(0, sep);
  const denoArgs = [
    "--unstable",
    "-A",
    `--no-check`,
  ];

  if (quiet) {
    denoArgs.push("--quiet");
  }

  // Flags passed to Deno
  const parsedArgs = parse(sep === -1 ? [] : args.slice(sep + 1));

  for (const [name, value] of Object.entries(parsedArgs)) {
    if (name === "_") {
      continue;
    }

    const flagName = name.length === 1 ? `-${name}` : `--${name}`;
    denoArgs.push(value === true ? flagName : `${flagName}=${value}`);
  }

  // Detect and use the deno.json file automatically
  const options = await getDenoConfig();

  if (options) {
    // To-do: For some reason, this is required in some cases. Needs research.
    denoArgs.push(`--config=${options.file}`);
  }

  // Add the import-map option to Deno if it's missing
  const importMapArg = parsedArgs["import-map"] || options?.config.importMap;
  const shouldWarn = !quiet &&
    !["import-map", "upgrade", "init"].includes(lumeArgs[0]);

  // There's a import map file
  if (importMapArg) {
    const importMapUrl = await toUrl(importMapArg);
    const importMap = await loadImportMap(importMapUrl);

    if (!importMap.imports["lume/"]) {
      // The import map doesn't include Lume imports
      shouldWarn && warn(
        red("Error:"),
        `The import map file ${
          dim(importMapArg)
        } does not include Lume imports.`,
        (importMapArg === "import_map.json")
          ? `Run ${cyan("lume import-map")} to update import_map.json.`
          : "",
      );
    } else {
      // Check whether the import_map.json file has the same lume version as the installed version.
      const cliVersion = getLumeVersion();
      const mapValue = importMap.imports["lume/"];
      const mapVersion = getLumeVersion(
        mapValue.startsWith("./")
          ? new URL(mapValue, importMapUrl)
          : new URL(mapValue),
      );

      if (cliVersion !== mapVersion) {
        shouldWarn && warn(
          red("Different lume versions mixed:"),
          `The import map file ${dim(importMapArg)} imports Lume ${
            dim(mapVersion)
          }`,
          `but CLI version is ${dim(cliVersion)}.`,
          (importMapArg === "import_map.json")
            ? `Run ${
              cyan("lume import-map")
            } to update import_map.json with your CLI version.`
            : undefined,
        );
      }
    }
  } else {
    // There's no import map file, so we generate one automatically
    const importMap = `data:application/json;base64,${
      encode(JSON.stringify(await getImportMap()))
    }`;
    denoArgs.push(`--import-map=${importMap}`);
  }

  return [lumeArgs, denoArgs];
}

/** Runs the Lume CLI */
export default async function main(args: string[]) {
  const denoInfo = checkDenoVersion();
  const quiet = args.includes("--quiet");

  if (denoInfo) {
    warn(
      red("Error running Lume"),
      `Lume needs Deno ${green(denoInfo.minimum)} or greater`,
      `Your current version is ${red(denoInfo.current)}`,
      `Run ${cyan(denoInfo.command)} and try again`,
    );
    Deno.exit(1);
  }

  const command = args[0];

  if (!quiet && command !== "upgrade" && command !== "import-map") {
    const info = await mustNotifyUpgrade();

    if (info) {
      warn(
        `Update available ${dim(info.current)}  → ${green(info.latest)}`,
        `Run ${cyan(info.command)} to update`,
      );
    }
  }

  const [lumeArgs, denoArgs] = await getArgs(args, quiet);
  const process = Deno.run({
    cmd: [
      Deno.execPath(),
      "run",
      ...denoArgs,
      new URL("./cli.ts", import.meta.url).href,
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

function warn(...lines: (string | undefined)[]) {
  const { args } = Deno;
  const syncWarn = args.includes("--serve") || args.includes("-s") ||
    args.includes("--watch") || args.includes("-w");

  if (syncWarn) {
    log(...lines);
  } else {
    addEventListener("unload", () => log(...lines));
  }
}
