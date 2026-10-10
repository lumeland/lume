import cac from "cac";
import pkg from "./package.json" with { type: "json" };

const cli = cac("🔥lume");

cli.version(pkg.version);

cli
  .command("build", "Build your site")
  .option("--config <config>", "The config file path.")
  .option("--src <src>", "The source directory for your site.", { default: "./" })
  .option("--dest <dest>", "The build destination.", { default: "_site" })
  .option("--location <type>", "The URL location of the site.", { default: "http://localhost" })
  .option("--dry-run", "Test the build without generating the files")
  .option("-s, --serve", "Start a live-reloading web server and watch changes.")
  .option("--no-cms", "Don't start LumeCMS if _cms.ts file is detected.")
  .option("-p, --port <port:number>", "The port where the server runs.", { default: 3000 })
  .option("--hostname <hostname>", "The hostname where the server runs.", { default: "localhost" })
  .option("-o, --open", "Open the site in a browser.")
  .option("-w, --watch", "Build and watch changes.")
  .option("-i, --inspect", "Opens an inspector server for debugging.")
  .action(async ({ config, serve, watch, cms, dryRun, inspect }) => {
    const { build } = await import("./src/build.ts");

    await build({
      config,
      serve,
      watch,
      cms,
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
