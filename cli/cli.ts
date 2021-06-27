import { Command } from "../deps/cliffy.ts";
import { getCurrentVersion, printError } from "./utils.ts";
import initCommand from "./init.ts";
import upgradeCommand from "./upgrade.ts";
import runCommand from "./run.ts";
import buildCommand from "./build.ts";

const init = new Command()
  .description("Create a config file for a new site")
  .example("lume init", "Creates a _config.js file in the current directory")
  .example("lume init --config=_config.ts", "To change the config file path")
  .option(
    "--config <file>",
    "Specify the lume config file",
    { default: "_config.js" },
  )
  .option(
    "--no-import-map",
    "Whether to use the import map or full URL",
  )
  .option(
    "--plugins <plugins:string[]",
    "A comma-separated list of plugins to use",
    { default: [] },
  )
  .action(initCommand);

const upgrade = new Command()
  .description("Upgrade your lume install to the latest version")
  .example("lume upgrade", "Upgrade to the latest stable version")
  .example("lume upgrade --dev", "Upgrade to the latest development version")
  .option(
    "-d, --dev [dev:boolean]",
    "Install the latest development version (latest git commit)",
  )
  .action(upgradeCommand);

const run = new Command()
  .description("Run one or more scripts from the lume config")
  .example(
    "lume run deploy",
    "Run the `deploy` script",
  )
  .example(
    "lume run deploy --config=_config.ts",
    "Run the `deploy` script from _config.ts file",
  )
  .example(
    "lume run build deploy",
    "Run the `build` and `deploy` scripts",
  )
  .option(
    "--root <root>",
    "The root where lume should work",
    { default: "./" },
  )
  .option(
    "--config <config>",
    "Specify the lume config file",
    { default: "_config.js" },
  )
  .option(
    "--src <src>",
    "The source directory for your site",
    { default: "./" },
  )
  .option(
    "--dest <dest>",
    "The build destination",
    { default: "_site" },
  )
  .option(
    "--location <location>",
    "The url location of the website",
    { default: "http://localhost" },
  )
  .option(
    "--quiet [quiet:boolean]",
    "Enable quiet mode (show less info)",
  )
  .action(runCommand);

const lume = new Command()
  .name("🔥lume")
  .version(getCurrentVersion)
  .description(
    "A static site generator for Deno. \nDocs: https://lumeland.github.io/",
  )
  .example("lume", "Build the site")
  .example("lume --serve", "Serve the site in localhost")
  .example("lume upgrade", "Upgrade lume to the latest version")
  .example("lume run <script>", "Run a custom script")
  .example("lume [COMMAND] --help", "Get help with a command")
  .option(
    "--root <root>",
    "The root where lume should work",
    { default: "./" },
  )
  .option(
    "--config <config>",
    "Specify the lume config file",
    { default: "_config.js" },
  )
  .option(
    "--src <src>",
    "The source directory for your site",
    { default: "./" },
  )
  .option(
    "--dest <dest>",
    "The build destination",
    { default: "_site" },
  )
  .option(
    "--location <location>",
    "The url location of the website",
    { default: "http://localhost" },
  )
  .option(
    "--metrics [metrics]",
    "Show the performance metrics or save them in a file",
  )
  .option(
    "--quiet [quiet:boolean]",
    "Enable quiet mode (show less info)",
  )
  .option(
    "-d, --dev [dev:boolean]",
    "Enable the dev mode (view draft pages)",
  )
  .option(
    "-s, --serve [serve:boolean]",
    "Start a live-reloading web server and watch changes",
  )
  .option(
    "-p, --port <port:number>",
    "The port where the server runs",
    { default: 3000 },
  )
  .option(
    "-o, --open [open:boolean]",
    "Open the site in the browser",
  )
  .option(
    "-w, --watch [watch:boolean]",
    "Build and watch changes",
  )
  .action(buildCommand)
  .command("init", init)
  .command("upgrade", upgrade)
  .command("run <script...>", run);

try {
  await lume.parse(Deno.args);
} catch (error) {
  printError(error);
  Deno.exit(1);
}
