import { log } from "../core/utils/log.ts";
import { toCamelCase, toSnakeCase } from "../deps/text.ts";
import type { Archetype } from "../core/archetypes.ts";

export default (function (name?: string) {
  name ??= prompt("Name of the plugin:") ?? undefined

  if (!name) {
    log.error("Missing name argument. Run 'deno task new plugin {name}");
    return;
  }

  const filename = toSnakeCase(name);
  const fnName = toCamelCase(name);

  return {
    base: "root",
    path: `/_plugins/${filename}.ts`,
    content: `import { merge } from "lume/core/utils/object.ts";

/** Plugin options */
export interface Options {
}

/** Default values */
export const defaults = {
} satisfies Options;

export function ${fnName}(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Lume.Site) => {
  };
}

export default ${fnName};
`,
  };
}) satisfies Archetype;
