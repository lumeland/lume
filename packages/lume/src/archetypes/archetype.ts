import { log } from "@lumeland/core/utils/log.ts";
import type { Archetype } from "@lumeland/core/archetypes.ts";

export default (function (name?: string) {
  if (!name) {
    log.error("Missing name argument. Run this command again adding the archetype name.");
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
} satisfies Archetype);
