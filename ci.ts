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
} from "./core/utils.ts";

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
        break;

      default: {
        const flagName = name.length === 1 ? `-${name}` : `--${name}`;
        denoArgs.push(value === true ? flagName : `${flagName}=${value}`);
      }
    }
  }

  // Detect and use the deno.json file automatically
  const options = await getDenoConfig();

  if (options) {
    denoArgs.push(`--config=deno.json`);
  }

  // Add the import-map option to Deno if it's missing
  const importMapUrl = parsedArgs["import-map"] || options?.importMap;

  // There's a import map file
  if (importMapUrl) {
    const importMap = await loadImportMap(importMapUrl);

    if (!importMap.imports["lume/"]) {
      // The import map doesn't include Lume imports
      console.log("----------------------------------------");
      console.error(red("Error:"));
      console.log(
        `The import map file ${
          dim(importMapUrl)
        } does not include Lume imports.`,
      );
      if (importMapUrl === "import_map.json") {
        console.log(
          `Run ${cyan("lume import-map")} to update import_map.json.`,
        );
      }
      console.log("----------------------------------------");
    } else {
      // Check whether the import_map.json file has the same version of lume as the installed version.
      const cliVersion = getLumeVersion();
      const mapVersion = getLumeVersion(new URL(importMap.imports["lume/"]));

      if (cliVersion !== mapVersion) {
        console.log("----------------------------------------");
        console.error(red("Warning:"));
        console.log(
          `The import map file ${dim(importMapUrl)} imports the Lume version ${
            dim(mapVersion)
          }`,
        );
        console.log(`but you are using Lume ${dim(cliVersion)}.`);
        if (importMapUrl === "import_map.json") {
          console.log(
            `Run ${cyan("lume import-map")} to update import_map.json.`,
          );
        }
        console.log("----------------------------------------");
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

export default async function main(args: string[]) {
  const denoInfo = checkDenoVersion();

  if (denoInfo) {
    console.log("----------------------------------------");
    console.error(red("Error running Lume"));
    console.log(`Lume needs Deno ${green(denoInfo.minimum)} or greater`);
    console.log(`Your current version is ${red(denoInfo.current)}`);
    console.log(`Run ${cyan(denoInfo.command)} and try again`);
    console.log("----------------------------------------");
    Deno.exit(1);
  }

  if (!args.includes("--quiet")) {
    const info = await mustNotifyUpgrade();

    if (info) {
      console.log("----------------------------------------");
      console.log(
        `Update available ${dim(info.current)}  → ${green(info.latest)}`,
      );
      console.log(`Run ${cyan(info.command)} to update`);
      console.log("----------------------------------------");
    }
  }

  const [lumeArgs, denoArgs] = await getArgs(args);
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
