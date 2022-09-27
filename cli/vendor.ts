import {
  getConfigFile,
  readDenoConfig,
  writeDenoConfig,
} from "../core/utils.ts";
import { join } from "../deps/path.ts";

interface Options {
  output: string;
  config?: string;
  remove?: boolean;
}

export default function ({ output, config, remove }: Options) {
  return vendor(output, config, remove);
}

/** Upgrade the Lume installation to the latest version */
export async function vendor(
  output: string,
  config?: string,
  remove?: boolean,
) {
  await removeVendor(output);

  if (remove) {
    return;
  }

  const configFile = await getConfigFile(config);
  const oldDenoConfig = await readDenoConfig();

  // Run deno vendor
  const specifiers: string[] = [
    import.meta.resolve("../ci.ts"),
    import.meta.resolve("../cli.ts"),
    configFile ? configFile : import.meta.resolve("../mod.ts"),
  ];

  await run(output, specifiers);

  // Fix the import map
  if (oldDenoConfig?.importMap) {
    const denoConfig = await readDenoConfig();

    if (denoConfig?.importMap) {
      for (
        let [specifier, path] of Object.entries(oldDenoConfig.importMap.imports)
      ) {
        if (denoConfig.importMap.imports[specifier]) {
          continue;
        }
        if (path.startsWith(".")) {
          path = join("./", output, path);
        }
        denoConfig.importMap.imports[specifier] = path;
      }

      await writeDenoConfig(denoConfig);
    }
  }
}

async function run(output: string, urls: string[]) {
  const process = Deno.run({
    cmd: [
      Deno.execPath(),
      "vendor",
      `--output=${output}`,
      ...urls,
    ],
  });

  const status = await process.status();
  process.close();

  if (!status.success) {
    throw new Error("Error vendoring Lume");
  }
}

async function removeVendor(output: string) {
  // Remove vendor directory
  try {
    await Deno.remove(output, { recursive: true });
  } catch {
    // Do nothing
  }

  // Revert the import_map.json file config
  const denoConfig = await readDenoConfig("./import_map.json");

  if (denoConfig) {
    await writeDenoConfig(denoConfig);
  } else {
    throw new Error("No deno.json file found");
  }
}
