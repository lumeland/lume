import { log } from "@lumeland/core/utils/log.ts";
import { resolveConfigFile } from "@lumeland/core/utils/lume_config.ts";
import { createSite } from "./utils/site.ts";

export interface RunOptions {
  archetype?: string;
  config?: string;
  args?: string[];
}

export async function run({ archetype, config, args }: RunOptions) {
  const _config = resolveConfigFile(["_config.ts", "_config.js"], config);
  const site = await createSite(_config);

  if (!archetype) {
    console.log();
    console.log("Add the archetype URL or one of the following names:");
    for (const name of site.archetypes.archetypes.keys()) {
      console.log(` - ${name}`);
    }
    console.log();
  } else {
    await site.archetypes.run(archetype, args);
  }

  log.output();
}
