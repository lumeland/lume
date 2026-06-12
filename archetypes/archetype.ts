import { log } from "../core/utils/log.ts";
import type { Archetype } from "../core/archetypes.ts";

export default (function (name?: string) {
  name ??= prompt("Name of the archetype:") ?? undefined

  if (!name) {
    log.error("Missing name argument. Run 'deno task new archetype {name}");
    return;
  }

  return {
    base: "root",
    path: `/_archetypes/${name}.ts`,
    content: `import { log } from "lume/core/utils/log.ts";

export default (function (name?: string) {
  name ??= prompt("Name:", "world") ?? undefined

  if (!name) {
    log.error("Missing arguments. Run 'deno task new ${name} {name}");
    return;
  }

  return {
    path: \`hello-\${name}.md\`,
    content: \`Hello \${name}\`,
  };
}) satisfies Lume.Archetype;
`,
  };
}) satisfies Archetype;
