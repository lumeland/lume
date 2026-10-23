import { log } from "@lumeland/core/utils/log.ts";
import type { Archetype } from "@lumeland/core/archetypes.ts";

export default (function (name?: string) {
  if (!name) {
    log.error("Missing 'name' argument. Run this command again adding the archetype name.");
    return;
  }

  return {
    base: "root",
    path: `/_archetypes/${name}.ts`,
    content: `import type { Archetype } from "@lumeland/core/archetypes.ts";

export default (function (name?: string) {
  if (!name) {
    console.error("Missing 'name' argument");
    return;
  }

  return {
    path: \`hello-\${name}.md\`,
    content: \`Hello \${name}\`,
  };
}) satisfies Archetype;
`,
  };
} satisfies Archetype);
