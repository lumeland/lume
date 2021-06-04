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

    -s, --serve             start a live-reloading web server
    -p, --port     <port>   the port where the server runs      Default: 3000
    -o, --open              open the site in the browser
`;

export async function run(args, userSite) {
  const options = parse(args, {
    string: ["root", "src", "dest", "config", "location", "port"],
    boolean: ["dev", "serve", "open"],
    alias: { dev: "d", serve: "s", port: "p", open: "o" },
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

  const site = await buildSite(options, userSite);
  console.log();
  await site.build();
  console.log();
  console.log(`🍾 ${brightGreen("Site built into")} ${gray(site.options.dest)}`);

  if (!options.serve) {
    return;
  }

  try {
    await server(site, options);
    const watcher = Deno.watchFs(site.src());
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
        changes.add(join("/", relative(site.src(), path)))
      );

      // Debounce
      clearTimeout(timer);
      timer = setTimeout(rebuild, 500);
    }
  } catch (err) {
    console.log(err);
  }
}
