import cac from "cac";
import pkg from "./package.json" with { type: "json" };

const cli = cac("lume");

cli.version(pkg.version);

cli
  .command("build", "Build your site")
  .option("--config <config>", "The config file path.")
  .option("--src <folder>", "The source directory for your site.", { default: "./" })
  .option("--dest <folder>", "The build destination.", { default: "_site" })
  .option("--location <url>", "The URL location of the site.", { default: "http://localhost" })
  .option("-s, --serve", "Start a live-reloading web server and watch changes.")
  .option("-p, --port <number>", "The port where the server runs.", { default: 3000 })
  .option("--hostname <hostname>", "The hostname where the server runs.", { default: "localhost" })
  .option("--dry-run", "Test the build without generating the files")
  .option("-o, --open", "Open the site in a browser.", { default: false })
  .option("-w, --watch", "Build and watch changes.", { default: false })
  .option("-i, --inspect", "Opens an inspector server for debugging.", { default: false })
  .action(async ({ config, serve, watch, dryRun, inspect }) => {
    const { build } = await import("./src/build.ts");

    await build({
      config,
      serve,
      watch,
      dryRun,
      inspect,
    });
  });

cli
  .command("run <archetype> [...args]", "Execute an archetype")
  .option("--config <config>", "The config file path.")
  .action(async (archetype, args, { config }) => {
    const { run } = await import("./src/run.ts");

    await run({
      archetype,
      config,
      args: args,
    });
  });

cli.help();
cli.parse(process.argv);
