import { brightGreen } from "../deps/colors.ts";
import {
  baseUrl,
  getConfigFile,
  getDenoConfig,
  getImportMap,
  loadImportMap,
  toUrl,
} from "../core/utils.ts";
import { join } from "../deps/path.ts";

interface Options {
  output: string;
  root: string;
  config?: string;
}

export default function ({ output, root, config }: Options) {
  return vendor(output, root, config);
}

/** Upgrade the Lume installation to the latest version */
export async function vendor(output: string, root: string, config?: string) {
  const configFile = await getConfigFile(root, config);
  const vendor = join(root, output);

  // Remove the previous vendoring if exists
  try {
    await Deno.remove(vendor, { recursive: true });
  } catch {
    // Do nothing
  }

  // Run deno vendor
  const specifiers: string[] = [
    new URL("./ci.ts", baseUrl).href,
    new URL("./cli.ts", baseUrl).href,
    configFile ? configFile : new URL("./mod.ts", baseUrl).href,
  ];

  await run(output, specifiers);

  // Write the import map
  const importMapFile = join(vendor, "import_map.json");
  const denoConfig = await getDenoConfig() || {};
  const currentMap = await getImportMap(denoConfig.importMap);
  const vendorMap = await loadImportMap(await toUrl(importMapFile));

  for (let [specifier, path] of Object.entries(currentMap.imports)) {
    if (vendorMap.imports[specifier]) {
      continue;
    }
    if (path.startsWith(".")) {
      path = join("./", output, path);
    }
    vendorMap.imports[specifier] = path;
  }
  await Deno.writeTextFile(
    importMapFile,
    JSON.stringify(vendorMap, null, 2) + "\n",
  );

  // Update deno.json file
  denoConfig.importMap = importMapFile;
  await Deno.writeTextFile(
    join(root, "deno.json"),
    JSON.stringify(denoConfig, null, 2) + "\n",
  );

  console.log(brightGreen("Lume vendored to:"), output);
  console.log(brightGreen("Deno configuration file saved:"), "deno.json");
  console.log(brightGreen("Import map file saved:"), denoConfig.importMap);
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
