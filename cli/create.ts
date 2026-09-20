import { Command } from "../deps/cliffy.ts";
import { log } from "../core/utils/log.ts";
import { resolveConfigFile } from "../core/utils/lume_config.ts";
import { createSite } from "./utils.ts";

export default new Command()
  .description("Run an archetype to create more files.")
  .example(
    "lume new post 'Post title'",
    "Create a new post file using the _archetypes/post.ts archetype.",
  )
  .option(
    "--config <config:string>",
    "The config file path.",
  )
  .action(async ({ config }, ...args: string[]) => {
    const [name, ...other] = args;
    await run(config, name, other);
  });

async function run(
  config?: string,
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
