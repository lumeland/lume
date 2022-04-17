import { brightGreen } from "../deps/colors.ts";
import { baseUrl, getDenoConfig, getImportMap } from "../core/utils.ts";

/** Generate import_map.json and deno.json files */
export default function () {
  return importMap(baseUrl);
}

export async function importMap(url: URL) {
  const config = await getDenoConfig() || {};
  let currentMap = config.importMap;

  if (!currentMap) {
    try {
      await Deno.stat("./import_map.json");
      currentMap = "./import_map.json";
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        throw error;
      }
    }
  }

  const importMap = await getImportMap(currentMap);
  importMap.imports["lume/"] = new URL("./", url).href;

  config.importMap ||= "import_map.json";
  const tasks = config.tasks || {};
  tasks.build = `deno run -A ${new URL("./ci.ts", url).href}`;
  tasks.serve = "deno task build -- -s";
  config.tasks = tasks;

  await Deno.writeTextFile(
    config.importMap,
    JSON.stringify(importMap, null, 2),
  );
  await Deno.writeTextFile("deno.json", JSON.stringify(config, null, 2));

  console.log(brightGreen("Deno configuration file saved:"), "deno.json");
  console.log(brightGreen("Import map file saved:"), config.importMap);
}
