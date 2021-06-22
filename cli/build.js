import { parse } from "../deps/flags.js";
import { server } from "../server.js";
import { brightGreen, gray } from "../deps/colors.js";
import { join, relative } from "../deps/path.js";
import { buildSite, printError, validateArgsCount } from "./utils.js";

export const HELP = `
${brightGreen("lume build")}: build the site and optionally serve it

USAGE:
    lume build [OPTIONS]

OPTIONS:
        --root     <dir>    the root where lume should work     Default: ./
        --src      <dir>    the source directory for your site  Default: ./
        --dest     <dir>    the build destination               Default: _site
        --config   <file>   specify the lume config file        Default: _config.js
        --location <url>    the domain for your site            Default: http://localhost
    -d, --dev               enable dev mode (view draft pages)
        --metrics [<file>]  show the performance metrics or save them in a file
        --verbose  <level>  different level of details (0/1/2)  Default: 1

    -s, --serve             start a live-reloading web server and watch changes
    -p, --port     <port>   the port where the server runs      Default: 3000
    -o, --open              open the site in the browser
    -w, --watch             build and watch changes
`;

export async function run(args) {
  const options = parse(args, {
    string: [
      "root",
      "src",
      "dest",
      "config",
      "location",
      "metrics",
      "verbose",
      "port",
    ],
    boolean: ["dev", "serve", "open", "watch"],
    alias: { dev: "d", serve: "s", port: "p", open: "o", watch: "w" },
    ["--"]: true,
    unknown(option) {
      if (option.startsWith("-")) {
        throw new Error(`Unknown option: ${option}`);
      }
    },
    default: {
      root: Deno.cwd(),
      config: "_config.js",
    },
  });

  validateArgsCount("build", options._, 1);

  const site = await buildSite(options);
  console.log();
  await site.build(options.serve);
  console.log();
  console.log(`🍾 ${brightGreen("Site built into")} ${gray(site.options.dest)}`);

  if (site.options.metrics) {
    if (options.metrics) {
      const file = join(Deno.cwd(), options.metrics);
      await site.metrics.save(file);
      console.log();
      console.log(`⏲ ${brightGreen("Metrics data saved in")} ${gray(file)}`);
      console.log();
    } else {
      console.log();
      console.log(`⏲ Metrics data:`);
      console.log();
      site.metrics.print();
    }
  }

  if (!options.serve && !options.watch) {
    return;
  }

  try {
    // Disable metrics for the watcher
    site.options.metrics = false;

    if (options.serve) {
      await server(site);
    }

    const sources = [...site.source.staticFiles].map(x => site.src(x[0]));
    const watcher = Deno.watchFs([site.src(), ...sources]);
    const changes = new Set();
    console.log("Watching for changes...");

    let timer = 0;

    const rebuild = async () => {
      console.log();
      console.log("Changes detected. Building...");
      const files = new Set(changes);
      changes.clear();

      try {
        await site.update(files);
        console.log("Done");
        console.log();
      } catch (err) {
        printError(err);
      }
    };

    for await (const event of watcher) {
      if (event.paths.every((path) => path.startsWith(site.dest()))) {
        continue;
      }

      event.paths.forEach((path) =>
        changes.add(join("./", relative(site.src(), path)))
      );

      // Debounce
      clearTimeout(timer);
      timer = setTimeout(rebuild, 500);
    }
  } catch (err) {
    console.log(err);
  }
}
