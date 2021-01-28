import { parse } from "./deps/flags.js";
import server from "../server.js";
import { brightGreen, gray } from "../deps/colors.js";
import { error } from "../deps/colors.js";
import { join, relative } from "../deps/path.js";
import {CliCommand, globalOptions} from "../cli.ts";

export const command: CliCommand = {
  name: "build",
  description: "Build the site",
  options: [
    ...globalOptions,
    {
      name: "serve",
      description: "Start a web server with live-reloading",
    },
    {
      name: "dev",
      description: "Run lume in dev mode to view draft pages."
    },
  ]
}
/**
 * Command to build the site and optionally serve it
 */
export default async function build(site, serve = false) {
  const options = parse(args, {
    boolean: ["serve", "dev", "help"],
    string: ["port", "src", "dest", "location", "root", "config"],
    alias: { help: "h" },
  });

  // handle --help fast
  if (options.help) {

  }
  // validate the options for this argument

  console.log("");
  await site.build();

  console.log("");
  console.log(`🍾 ${brightGreen("Site built into")} ${gray(site.options.dest)}`);

  if (!serve) {
    return;
  }

  try {
    await server(site);
    const watcher = Deno.watchFs(site.src());
    const changes = new Set();
    console.log("Watching for changes...");

    let timer = 0;

    const rebuild = async () => {
      console.log("");
      console.log("Changes detected. Building...");
      const files = new Set(changes);
      changes.clear();

      try {
        await site.update(files);
        console.log("Done");
        console.log("");
      } catch (err) {
        error("rebuild", "Error on build the site", err);
      }
    };

    for await (const event of watcher) {
      if (event.paths.every((path) => path.startsWith(site.dest()))) {
        continue;
      }

      event.paths.forEach((path) =>
        changes.add(join("/", relative(site.src(), path)))
      );

      //Debounce
      clearTimeout(timer);
      timer = setTimeout(rebuild, 500);
    }
  } catch (err) {
    console.log(err);
  }
}
