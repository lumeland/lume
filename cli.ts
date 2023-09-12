import { Command, CompletionsCommand, EnumType } from "./deps/cliffy.ts";
import { getLumeVersion } from "./core/utils.ts";
import { printError } from "./core/errors.ts";
import upgradeCommand from "./cli/upgrade.ts";
import runCommand from "./cli/run.ts";
import buildCommand from "./cli/build.ts";
import createCommand from "./cli/create.ts";

const upgrade = new Command()
  .description("Upgrade your Lume executable to the latest version.")
  .type("branch", new EnumType(["master", "v2"]))
  .option(
    "--version <version:string>",
    "The version to upgrade to.",
  )
  .option(
    "-d, --dev [dev:branch]",
    "Install the latest development version (last Git commit).",
  )
  .example("lume upgrade -g", "Upgrades to the latest stable version.")
  .example("lume upgrade --dev", "Upgrades to the latest development version.")
  .action(upgradeCommand);

const create = new Command()
  .description("Run an archetype to create more files.")
  .example(
    "lume new post 'Post title'",
    "Create a new post file using the _archetypes/post.ts archetype.",
  )
  // @ts-ignore: todo: fix this
  .action(createCommand);

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
  .command("new <archetype> [arguments...]", create)
  .command("upgrade", upgrade)
  .command("run <script...>", run)
  .command("completions", new CompletionsCommand());

try {
  await lume.parse(Deno.args);
} catch (error) {
  printError(error);
  Deno.exit(1);
}
