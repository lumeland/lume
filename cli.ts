import { Command, CompletionsCommand } from "./deps/cliffy.ts";
import { getCurrentVersion } from "./core/utils/lume_version.ts";

const upgrade = new Command()
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
    const { upgrade } = await import("./cli/upgrade.ts");
    await upgrade(dev, version);
  });

const create = new Command()
  .description("Run an archetype to create more files.")
  .example(
    "lume new post 'Post title'",
    "Create a new post file using the _archetypes/post.ts archetype.",
  )
  // @ts-ignore: todo: fix this
  .action(async ({ config }, name, ...args) => {
    const { create } = await import("./cli/create.ts");
    await create(config, name, args);
  });

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
  .action(async ({ config }, ...scripts) => {
    const { run } = await import("./cli/run.ts");
    await run(config, scripts);
  });

const cms = new Command()
  .description("Run Lume CMS.")
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
  .action(async ({ config }) => {
    const { runCms } = await import("./cli/cms.ts");
    await runCms(config);
  });

const lume = new Command()
  .name("🔥lume")
  .version(() => getCurrentVersion())
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
    "--location <type:string>",
    "The URL location of the site.",
    { default: "http://localhost" },
  )
  .option(
    "-s, --serve",
    "Start a live-reloading web server and watch changes.",
  )
  .option(
    "-p, --port <port:number>",
    "The port where the server runs.",
    { default: 3000, depends: ["serve"] },
  )
  .option(
    "-o, --open",
    "Open the site in a browser.",
    { depends: ["serve"] },
  )
  .option(
    "-w, --watch",
    "Build and watch changes.",
  )
  .action(async ({ config, serve, watch }) => {
    const { build } = await import("./cli/build.ts");
    await build(config, serve, watch);
  })
  .command("new <archetype> [arguments...]", create)
  .command("upgrade", upgrade)
  .command("run <script...>", run)
  .command("cms", cms)
  .command("completions", new CompletionsCommand());

try {
  await lume.parse(Deno.args);
} catch (error) {
  console.error(Deno.inspect(error, { colors: true }));
  Deno.exit(1);
}
