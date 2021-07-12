import { Site } from "../types.ts";
import { printError } from "./utils.ts";
import { join, relative } from "../deps/path.ts";

/** Watch and rebuild the site on changes */
export default async function watch(site: Site) {
  // Disable metrics for the watcher
  site.options.metrics = false;

  const watcher = Deno.watchFs(site.src());
  const changes: Set<string> = new Set();
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
    } catch (error) {
      printError(error);
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
}
