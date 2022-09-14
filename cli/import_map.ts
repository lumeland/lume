import { brightGreen } from "../deps/colors.ts";
import { getDenoConfig, getImportMap } from "../core/utils.ts";
import { initPlugins, promptConfigUpdate } from "./utils.ts";

interface Options {
  plugins?: string[];
}

/** Generate import_map.json and deno.json files */
export default function ({ plugins }: Options = {}) {
  return importMap(new URL(import.meta.resolve("../")), plugins || []);
}

export async function importMap(url: URL, plugins: string[] = []) {
  const denoConfig = await getDenoConfig();
  const config = denoConfig?.config || {};

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

  // Transform the import map and deno config by the plugins
  await Promise.all(plugins.map(async (name) => {
    if (initPlugins.includes(name)) {
      const { init } = await import(`../plugins/${name}.ts`);
      init(importMap, config);
    }
  }));

  // Write import map file and deno.json
  await Deno.writeTextFile(
    config.importMap,
    JSON.stringify(importMap, null, 2) + "\n",
  );

  if (denoConfig?.file === "deno.jsonc") {
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
