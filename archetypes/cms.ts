import { log } from "../core/utils/log.ts";
import { normalizePath } from "../core/utils/path.ts";
import type { Archetype } from "../core/archetypes.ts";

export default (async function* (name = "_cms.ts") {
  if (!name.endsWith(".ts") && !name.endsWith(".js")) {
    log.error("The CMS filename must have the .ts or .js extension.");
    return;
  }

  // Generate the _cms.ts file
  const path = normalizePath(name);

  yield {
    base: "root",
    path,
    content: `import lumeCMS from "lume/cms/mod.ts";

const cms = lumeCMS();

export default cms;
`,
  };

  // Modify the import map in the deno.json file
  const response = await fetch(
    "https://data.jsdelivr.com/v1/package/gh/lumeland/cms",
  );
  const json = await response.json();

  yield {
    base: "root",
    path: "deno.json",
    // deno-lint-ignore no-explicit-any
    content(prev: Record<string, any> = {}) {
      prev.imports ??= {};
      prev.imports["lume/cms/"] = `https://cdn.jsdelivr.net/gh/lumeland/cms@${
        json.versions[0]
      }/`;
      return prev;
    },
  };
}) satisfies Archetype;
