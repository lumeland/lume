import server from "../server.js";
import { brightGreen, gray } from "../deps/colors.js";
import { error } from "../deps/colors.js";
import { join, relative } from "../deps/path.js";

/**
 * Command to build the site and optionally serve it
 */
export default async function build(site, serve = false) {
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
