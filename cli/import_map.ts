import { brightGreen } from "../deps/colors.ts";
import { baseUrl, getDenoConfig, getImportMap } from "../core/utils.ts";

/** Generate import_map.json and deno.json files */
export default async function importMap(url: string | URL = baseUrl) {
  const config = await getDenoConfig() || {};
  const importMap = await getImportMap(config.importMap);

  config.importMap ||= "import_map.json";
  const tasks = config.tasks || {};
  tasks.build = `deno run -A ${new URL("./ci.ts", url).href}`;
  tasks.serve = "deno task build -- -s";

  await Deno.writeTextFile(
    config.importMap,
    JSON.stringify(importMap, null, 2),
  );
  await Deno.writeTextFile("deno.json", JSON.stringify(config, null, 2));

  console.log(brightGreen("Deno configuration file saved:"), "deno.json");
  console.log(brightGreen("Import map file saved:"), config.importMap);
}
