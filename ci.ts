import { encode } from "./deps/base64.ts";
import { checkDenoVersion, ImportMap, readDenoConfig } from "./core/utils.ts";

/**
 * This file works as a proxy to the actual Lume CLI to fix the following issues:
 * - Add defaults flags to Deno (--unstable, -A)
 * - Detect and set the lume --quiet flag in Deno.
 * - Detect and use the deno.json file automatically.
 * - Add the import-map option to Deno if it's missing
 */

/** Returns the Lume & Deno arguments */
export async function getArgs(
  lumeArgs: string[],
  quiet: boolean,
): Promise<[string[], string[]]> {
  const denoArgs = [
    "--unstable",
    "-A",
  ];

  if (quiet) {
    denoArgs.push("--quiet");
  }

  // Detect and use the deno.json file automatically
  const denoConfig = await readDenoConfig();
  const { file, config } = denoConfig || {};

  if (file) {
    // To-do: For some reason, this is required in some cases. Needs research.
    denoArgs.push(`--config=${file}`);
  }

  // There's no import map file, so we generate one automatically
  if (!config?.importMap) {
    const importMap: ImportMap = {
      imports: {
        "lume/": import.meta.resolve("./"),
      },
    };
    const dataUrl = `data:application/json;base64,${
      encode(JSON.stringify(importMap))
    }`;
    denoArgs.push(`--import-map=${dataUrl}`);
  }

  return [lumeArgs, denoArgs];
}

/** Runs the Lume CLI */
export default async function main(args: string[]) {
  const quiet = args.includes("--quiet");

  checkDenoVersion();

  const [lumeArgs, denoArgs] = await getArgs(args, quiet);
  const process = Deno.run({
    cmd: [
      Deno.execPath(),
      "run",
      ...denoArgs,
      import.meta.resolve("./cli.ts"),
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
