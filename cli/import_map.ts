import { brightGreen } from "../deps/colors.ts";
import { getDenoOptions, getImportMap } from "../core/utils.ts";

/** Generate import_map.json and deno.json files */
export default async function importMap() {
  const options = await getDenoOptions();
  const importMap = await getImportMap(options.importMap);

  options.importMap ||= "import_map.json";

  await Deno.writeTextFile(
    options.importMap,
    JSON.stringify(importMap, null, 2),
  );
  await Deno.writeTextFile("deno.json", JSON.stringify(options, null, 2));

  console.log(brightGreen("Deno config saved in"), "deno.json");
  console.log(brightGreen("Import map saved in"), options.importMap);
}
