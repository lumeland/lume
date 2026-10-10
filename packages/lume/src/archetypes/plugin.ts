import { log } from "@lumeland/core/utils/log.ts";
import { toCamelCase, toSnakeCase } from "../../deps/text.ts";
import type { Archetype } from "@lumeland/core/archetypes.ts";

export default (function (name?: string) {
  if (!name) {
    log.error("Missing name argument. Run this command again adding the plugin name.");
    return;
  }

  const filename = toSnakeCase(name);
  const fnName = toCamelCase(name);

  return {
    base: "root",
    path: `/_plugins/${filename}.ts`,
    content: `import { merge } from "@lumeland/core/utils/object.ts";

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
} satisfies Archetype);
