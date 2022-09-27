import { readDenoConfig, writeDenoConfig } from "../core/utils.ts";
import { initPlugins } from "./utils.ts";

interface Options {
  plugins?: string[];
}

/** Generate import_map.json and deno.json files */
export default function ({ plugins }: Options = {}) {
  return importMap(new URL(import.meta.resolve("../")), plugins || []);
}

export async function importMap(url: URL, plugins: string[] = []) {
  const denoConfig = await readDenoConfig();

  const config = denoConfig?.config || {};
  const importMap = denoConfig?.importMap || { imports: {} };
  const file = denoConfig?.file || "deno.json";

  // Configure the import map
  config.importMap ||= "./import_map.json";

  const oldUrl = importMap.imports["lume/"];
  const newUrl = new URL("./", url).href;
  importMap.imports["lume/"] = newUrl;

  for (const [specifier, url] of Object.entries(importMap.imports)) {
    if (url.startsWith(oldUrl)) {
      importMap.imports[specifier] = url.replace(oldUrl, newUrl);
    }
  }

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

  // Write the configuration
  await writeDenoConfig({ file, importMap, config });
}
