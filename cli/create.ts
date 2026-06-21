import { log } from "../core/utils/log.ts";
import { resolveConfigFile } from "../core/utils/lume_config.ts";
import { createSite } from "./utils.ts";

/** Run an archetype */
export async function create(
  config: string | undefined,
  name?: string,
  args?: string[],
) {
  const _config = await resolveConfigFile(["_config.ts", "_config.js"], config);
  const site = await createSite(_config);

  if (!name) {
    console.log();
    console.log("Add the archetype URL or one of the following names:");
    for (const name of site.archetypes.archetypes.keys()) {
      console.log(` - ${name}`);
    }
    console.log();
  } else {
    await site.archetypes.run(name, args);
  }

  log.output();
}
