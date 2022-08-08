import { brightGreen } from "../deps/colors.ts";
import { exists } from "../deps/fs.ts";
import { baseUrl, getDenoConfig, getImportMap } from "../core/utils.ts";
import { promptConfigUpdate } from "./utils.ts";

/** Generate import_map.json and deno.json files */
export default function () {
  return importMap(baseUrl);
}

export async function importMap(url: URL) {
  const config = await getDenoConfig() || {};

  // Configure the import map
  const importMap = await getImportMap(config.importMap);
  importMap.imports["lume/"] = new URL("./", url).href;
  config.importMap ||= "import_map.json";

  // Configure lume tasks
  const tasks = config.tasks || {};
  tasks.lume = `deno eval "import 'lume/task.ts'" --`;
  tasks.build = "deno task lume";
  tasks.serve = "deno task lume -s";
  config.tasks = tasks;

  // Write import map file and deno.json
  await Deno.writeTextFile(
    config.importMap,
    JSON.stringify(importMap, null, 2) + "\n",
  );

  if (await exists("deno.jsonc")) {
    promptConfigUpdate({ importMap: config.importMap, tasks: config.tasks });
  } else {
    await Deno.writeTextFile(
      "deno.json",
      JSON.stringify(config, null, 2) + "\n",
    );

    console.log(brightGreen("Deno configuration file saved:"), "deno.json");
  }

  console.log(brightGreen("Import map file saved:"), config.importMap);
}
