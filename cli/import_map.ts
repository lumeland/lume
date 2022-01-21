import { brightGreen } from "../deps/colors.ts";
import { getImportMap, ImportMap, toUrl } from "../core/utils.ts";

interface Options {
  file: string;
}

/** Generate a _config.js file */
export default async function importMap({ file }: Options) {
  let importMap: ImportMap;
  let updated = false;

  try {
    const mapUrl = await toUrl(file);
    const mapContent = await (await fetch(mapUrl)).text();
    const parsedMap = JSON.parse(mapContent) as ImportMap;
    importMap = getImportMap(parsedMap, mapUrl);
    updated = true;
  } catch {
    importMap = getImportMap();
  }

  await Deno.writeTextFile(file, JSON.stringify(importMap, null, 2));
  console.log();

  if (updated) {
    console.log(brightGreen("Updated the file"), file);
  } else {
    console.log(brightGreen("Created a new import map file"), file);
  }
}
