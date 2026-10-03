import { Command } from "../deps/cliffy.ts";
import { upgrade } from "../deps/init.ts";

export default new Command()
  .description("Upgrade your Lume executable to the latest version.")
  .option(
    "--version <version:string>",
    "The version to upgrade to.",
  )
  .option(
    "-d, --dev",
    "Install the latest development version (last Git commit).",
  )
  .example("lume upgrade -g", "Upgrades to the latest stable version.")
  .example("lume upgrade --dev", "Upgrades to the latest development version.")
  .action(async ({ dev, version }) => {
    const process = upgrade({ path: ".", dev, version });
    await process.run();
  });
