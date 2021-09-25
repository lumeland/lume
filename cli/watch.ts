import { printError } from "./utils.ts";
import { join, relative } from "../deps/path.ts";

export interface WatchOptions {
  /** The folder root to watch */
  root: string;
  /** The folder destination that must be ignored by the watcher */
  ignore: string;
  /** The update function */
  update: (files: Set<string>) => Promise<void>;
}

/** Watch and rebuild the site on changes */
export default async function watch(options: WatchOptions) {
  const watcher = Deno.watchFs(options.root);
  const changes: Set<string> = new Set();
  console.log("Watching for changes...");

  let timer = 0;

  const rebuild = async () => {
    console.log();
    console.log("Changes detected. Building...");
    const files = new Set(changes);
    changes.clear();

    try {
      await options.update(files);
      console.log("Done");
      console.log();
    } catch (error) {
      printError(error);
    }
  };

  for await (const event of watcher) {
    if (event.paths.every((path) => path.startsWith(options.ignore))) {
      continue;
    }

    event.paths.forEach((path) =>
      changes.add(join("/", relative(options.root, path)))
    );

    // Debounce
    clearTimeout(timer);
    timer = setTimeout(rebuild, 500);
  }
}
