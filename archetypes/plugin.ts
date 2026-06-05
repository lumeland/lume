import { log } from "../core/utils/log.ts";
import { toCamelCase, toSnakeCase } from "../deps/text.ts";

export default function (name: string) {
  if (!name) {
    log.error("Missing plugin name. Run 'deno task new plugin plugin-name");
    return;
  }

  const filename = toSnakeCase(name);
  const pluginName = toCamelCase(name);

  return {
    path: `/_plugins/${filename}.ts`,
    content: `import { merge } from "lume/core/utils/object.ts";

/** Plugin options */
export interface Options {
}

/** Default values */
export const defaults = {
} satisfies Options;

/** ${name} plugin */
export function ${pluginName}(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Lume.Site) => {
  }
}

export default ${pluginName};
`,
  };
}
