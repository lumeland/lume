import { createSite, runWatch } from "./utils.ts";
import { brightGreen, dim } from "../deps/colors.ts";
import Server from "../core/server.ts";
import contentType from "../middlewares/content_type.ts";
import logger from "../middlewares/logger.ts";
import noCache from "../middlewares/no_cache.ts";
import notFound from "../middlewares/not_found.ts";
import reload from "../middlewares/reload.ts";

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
  const { port, open, page404 } = site.options.server;

  const server = createServer({
    root: site.dest(),
    port,
    open,
    page404,
    directoryIndex: true,
  });

  await server.start();
}

/** Build the site using a Worker so it can reload the modules */
function runExperimentalWatcher(
  initServer: boolean,
  root: string,
  config?: string,
) {
  const url = new URL("exp_watcher.ts", import.meta.url);
  let server: Server | undefined;

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
        if (server || !initServer) {
          return;
        }

        const { root, options } = event.data;
        server = createServer({
          root,
          open: options.open,
          port: options.port,
          directoryIndex: true,
          page404: options.page404,
        });
        server.start();
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

interface serveOptions {
  root: string;
  port: number;
  open: boolean;
  directoryIndex: boolean;
  page404: string;
}

function createServer(options: serveOptions): Server {
  const { root, port, open, directoryIndex, page404 } = options;

  const server = new Server({ root, port, open });

  server.use(
    logger(),
    reload({ root }),
    contentType(),
    noCache(),
    notFound({
      root,
      page404,
      directoryIndex,
    }),
  );

  return server;
}
