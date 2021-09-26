import { createSite } from "./utils.ts";
import { brightGreen, gray } from "../deps/colors.ts";
import runServe from "./serve.ts";

interface Options {
  root: string;
  config?: string;
  serve: boolean;
  watch: boolean;
}

/** Build the website and optionally watch changes and serve the site */
export default async function build(
  { root, config, serve, watch }: Options,
) {
  if (serve || watch) {
    buildAndWatch(serve, root, config);
    return;
  }

  const site = await createSite(root, config);
  const quiet = site.options.quiet;

  if (!quiet) {
    console.log();
  }

  await site.build(false);

  if (!quiet) {
    console.log();
    console.log(
      `🍾 ${brightGreen("Site built into")} ${gray(site.options.dest)}`,
    );
  }
}

/** Build the site using a Worker so it can reload the modules */
function buildAndWatch(initServer: boolean, root: string, config?: string) {
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
