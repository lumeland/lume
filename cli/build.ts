import { createSite, runWatch } from "./utils.ts";
import { brightGreen, dim } from "../deps/colors.ts";
import runServe from "./serve.ts";
import Server from "../server/mod.ts";
import * as middlewares from "../server/middlewares.ts";

interface Options {
  root: string;
  config?: string;
  serve: boolean;
  watch: boolean;
  experimental: boolean;
}

/** Build the website and optionally watch changes and serve the site */
export default async function build(
  { root, config, serve, watch, experimental }: Options,
) {
  if (experimental) {
    if (!serve && !watch) {
      console.warn("Experimental mode requires either --serve or --watch");
      return;
    }
    runExperimentalWatcher(serve, root, config);
    return;
  }

  const site = await createSite(root, config);
  const quiet = site.options.quiet;

  if (!quiet) {
    console.log();
  }

  await site.build();

  if (!quiet) {
    console.log();
    console.log(
      `🍾 ${brightGreen("Site built into")} ${dim(site.options.dest)}`,
    );
  }

  if (!serve && !watch) {
    return;
  }
  const server = new Server({
    root: site.dest(),
    port: site.options.server.port,
    open: site.options.server.open,
    page404: site.options.server.page404,
  });

  server.use(middlewares.log);
  server.use(middlewares.contentLength);
  server.use(middlewares.contentType);
  server.use(middlewares.noCache);

  await server.start();

  return;
  // Start the watcher
  runWatch({
    root: site.src(),
    ignore: site.options.watcher.ignore,
    debounce: site.options.watcher.debounce,
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
function runExperimentalWatcher(
  initServer: boolean,
  root: string,
  config?: string,
) {
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
