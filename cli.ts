import { Command, CompletionsCommand } from "./deps/cliffy.ts";
import { getLumeVersion } from "./core/utils.ts";
import { printError } from "./core/errors.ts";
import initCommand from "./cli/init.ts";
import upgradeCommand from "./cli/upgrade.ts";
import runCommand from "./cli/run.ts";
import buildCommand from "./cli/build.ts";
import importMapCommand from "./cli/import_map.ts";
import vendorCommand from "./cli/vendor.ts";

const init = new Command()
  .description("Create a config file for a new site.")
  .example("lume init", "Creates a _config.js file in the current directory.")
  .action(initCommand);

const upgrade = new Command()
  .description("Upgrade your Lume executable to the latest version.")
  .option(
    "--version <version:string>",
    "The version to upgrade to.",
  )
  .option(
    "-g, --global [global:boolean]",
    "To install lume globally (with deno install).",
    { default: true },
  )
  .example("lume upgrade", "Upgrades to the latest stable version.")
  .example("lume upgrade --dev", "Upgrades to the latest development version.")
  .option(
    "-d, --dev [dev:boolean]",
    "Install the latest development version (last Git commit).",
  )
  .action(upgradeCommand);

const importMap = new Command()
  .description("Create or update a import map file with the Lume imports.")
  .example("lume import-map", "Create/update the file import_map.json.")
  .action(importMapCommand);

const vendor = new Command()
  .description("Vendor remote modules into _vendor local directory.")
  .example("lume vendor", "Vendor to _vendor directory.")
  .option(
    "--output <output:string>",
    "The output directory to write the vendor files to.",
    { default: "_vendor" },
  )
  .option(
    "--root <root:string>",
    "The directory where Lume should work.",
    { default: "./" },
  )
  .option(
    "--remove [remove:boolean]",
    "To remove an existing vendor.",
  )
  .option(
    "--config <config:string>",
    "The config file path.",
  )
  .action(vendorCommand);

const run = new Command()
  .description("Run one or more scripts from the config file.")
  .example(
    "lume run deploy",
    "Runs the `deploy` script.",
  )
  .example(
    "lume run deploy --config=_config.ts",
    "Runs the `deploy` script from the _config.ts file.",
  )
  .example(
    "lume run build deploy",
    "Runs the `build` and `deploy` scripts.",
  )
  .option(
    "--root <root:string>",
    "The directory where Lume should work.",
    { default: "./" },
  )
  .option(
    "--config <config:string>",
    "The config file path.",
  )
  .option(
    "--src <src:string>",
    "The source directory for your site.",
    { default: "./" },
  )
  .option(
    "--dest <dest:string>",
    "The build destination.",
    { default: "_site" },
  )
  .option(
    "--location <location>",
    "The URL location of the site.",
    { default: "http://localhost" },
  )
  .option(
    "--quiet [quiet:boolean]",
    "Enable quiet mode (show less info).",
  )
  // @ts-ignore: todo: fix this
  .action(runCommand);

const lume = new Command()
  .name("🔥lume")
  .version(() => getLumeVersion())
  .description(
    "A static site generator for Deno. \nDocs: https://lume.land",
  )
  .example("lume", "Builds the site.")
  .example("lume --serve", "Serves the site in localhost.")
  .example("lume upgrade", "Upgrades Lume to the latest version.")
  .example("lume run <script>", "Runs a custom script.")
  .example("lume [COMMAND] --help", "Shows the help for a command.")
  .option(
    "--root <root:string>",
    "The directory where Lume should work.",
    { default: "./" },
  )
  .option(
    "--config <config:string>",
    "The config file path.",
  )
  .option(
    "--src <src:string>",
    "The source directory for your site.",
    { default: "./" },
  )
  .option(
    "--dest <dest:string>",
    "The build destination.",
    { default: "_site" },
  )
  .option(
    "--location <location>",
    "The URL location of the site.",
    { default: "http://localhost" },
  )
  .option(
    "--quiet [quiet:boolean]",
    "Enable quiet mode (show less info).",
  )
  .option(
    "-d, --dev [dev:boolean]",
    "Enable development mode (view draft pages).",
  )
  .option(
    "-s, --serve [serve:boolean]",
    "Start a live-reloading web server and watch changes.",
  )
  .option(
    "-p, --port <port:number>",
    "The port where the server runs.",
    { default: 3000, depends: ["serve"] },
  )
  .option(
    "-o, --open [open:boolean]",
    "Open the site in a browser.",
    { depends: ["serve"] },
  )
  .option(
    "-w, --watch [watch:boolean]",
    "Build and watch changes.",
  )
  .action(buildCommand)
  .command("init", init)
  .command("upgrade", upgrade)
  .command("import-map", importMap)
  .command("vendor", vendor)
  .command("run <script...>", run)
  .command("completions", new CompletionsCommand());

try {
  await lume.parse(Deno.args);
} catch (error) {
  printError(error);
  Deno.exit(1);
}
