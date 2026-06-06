import { log } from "../core/utils/log.ts";
import { toSnakeCase } from "../deps/text.ts";
import type { Archetype } from "../cli/create.ts";

export default (function (name: string) {
  if (!name) {
    log.error("Missing name argument. Run 'deno task new archetype {name}");
    return;
  }

  const filename = toSnakeCase(name);

  return {
    base: "root",
    path: `/_archetypes/${filename}.ts`,
    content: `export default (function (name: string) {
  return {
    path: \`hello-\${name}.md\`,
    content: \`Hello \${name}\`,
  };
}) satisfies Lume.Archetype;
`,
  };
}) satisfies Archetype;
