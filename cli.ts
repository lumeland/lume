import { Command } from "./deps/cliffy.ts";
import { getCurrentVersion } from "./core/utils/lume_version.ts";

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
    "--dry-run",
    "Test the build without generating the files",
    { conflicts: ["serve", "watch"] },
  )
  .option(
    "-s, --serve",
    "Start a live-reloading web server and watch changes.",
  )
  .option(
    "--no-cms",
    "Don't start LumeCMS if _cms.ts file is detected.",
    { depends: ["serve"] },
  )
  .option(
    "-p, --port <port:number>",
    "The port where the server runs.",
    { default: 3000, depends: ["serve"] },
  )
  .option(
    "--hostname <hostname>",
    "The hostname where the server runs.",
    { default: "localhost", depends: ["serve"] },
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
  .option(
    "-i, --inspect",
    "Opens an inspector server for debugging.",
  )
  .action(async ({ config, serve, watch, cms, dryRun, inspect }) => {
    const { build } = await import("./cli/build.ts");
    build(config, serve, watch, cms, dryRun, inspect);
  })
  .command("new [archetype] [arguments...]", () => import("./cli/create.ts"))
  .command("upgrade", () => import("./cli/upgrade.ts"));

try {
  await lume.parse(Deno.args);
} catch (error) {
  console.error(Deno.inspect(error, { colors: true }));
  Deno.exit(1);
}
