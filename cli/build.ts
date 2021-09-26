import { createSite, runWatch } from "./utils.ts";
import { brightGreen, dim } from "../deps/colors.ts";
import runServe from "./serve.ts";

interface Options {
  root: string;
  config?: string;
  serve: boolean;
  watch: boolean;
  rebuild: boolean;
}

/** Build the website and optionally watch changes and serve the site */
export default async function build(
  { root, config, serve, watch, rebuild }: Options,
) {
  if (rebuild) {
    runRebuild(serve, root, config);
    return;
  }

  const site = await createSite(root, config);
  const quiet = site.options.quiet;

  if (!quiet) {
    console.log();
  }

  await site.build(serve);

  if (!quiet) {
    console.log();
    console.log(
      `🍾 ${brightGreen("Site built into")} ${dim(site.options.dest)}`,
    );
  }

  if (!serve && !watch) {
    return;
  }

  // Disable metrics for the watcher
  site.options.metrics = false;

  // Start the watcher
  runWatch({
    root: site.src(),
    ignore: site.dest(),
    fn: (files) => {
      console.log();
      console.log("Changes detected:");
      files.forEach((file) => console.log("-", dim(file)));
      console.log();
      return site.update(files);
    },
  });

  // Start the local server
  if (serve) {
    await runServe(site.dest(), site.options.server);
  }
}

/** Build the site using a Worker so it can reload the modules */
function runRebuild(initServer: boolean, root: string, config?: string) {
  const url = new URL("watch.ts", import.meta.url);
  let serving = false;

  function init() {
    const work = new Worker(url, {
      type: "module",
      deno: true,
    });

    // Start watching
    work.postMessage({ root, config });

    // Listen for messages
    work.onmessage = (event) => {
      const { type } = event.data;

      // Init the local server
      if (type === "built") {
        if (serving || !initServer) {
          return;
        }

        const { root, options } = event.data;
        runServe(root, options);
        serving = true;
        return;
      }

      // Reload the worker
      if (type === "reload") {
        work.terminate();
        init();
      }
    };
  }

  init();
}
