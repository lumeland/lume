import { log } from "../core/utils/log.ts";
import { localIp, openBrowser } from "../core/utils/net.ts";
import { setEnv } from "../core/utils/env.ts";
import Server from "../core/server.ts";
import { normalizePath } from "../core/utils/path.ts";
import { fromFileUrl } from "../deps/path.ts";
import { SiteWatcher } from "../core/watcher.ts";
import logger from "../middlewares/logger.ts";
import noCache from "../middlewares/no_cache.ts";
import noCors from "../middlewares/no_cors.ts";
import notFound from "../middlewares/not_found.ts";
import reload from "../middlewares/reload.ts";
import { buildSite } from "./utils.ts";
import { initLocalStorage } from "./missing_worker_apis.ts";

addEventListener("message", (event) => {
  const { type } = event.data;

  if (type === "build" || type === "rebuild") {
    return build(event.data);
  }

  if (type === "localStorage") {
    return initLocalStorage(event.data.data);
  }
});

interface BuildOptions {
  type: "build" | "rebuild";
  config?: string;
  serve?: boolean;
}

async function build({ type, config, serve }: BuildOptions) {
  // Set the live reload environment variable to add hash to the URLs in the module loader
  setEnv("LUME_LIVE_RELOAD", "true");

  const site = await buildSite(config);

  // Start the watcher
  const watcher = site.getWatcher();
  const _config = normalizePath(
    fromFileUrl(site._data.configFile as string),
    site.root(),
  );

  const mustReload = (files: Set<string>): boolean => files.has(_config);

  watcher.addEventListener("change", (event) => {
    const files = event.files!;

    log.info("Changes detected:");
    files.forEach((file) => {
      log.info(`- <gray>${file}</gray>`);
    });

    if (mustReload(files)) {
      log.info("Reloading the site...");
      postMessage({ type: "reload" });
      return;
    }

    return site.update(files);
  });

  watcher.addEventListener("error", (event) => {
    console.error(Deno.inspect(event.error, { colors: true }));
  });

  watcher.start();

  if (!serve) {
    return;
  }

  // Start the local server
  const { port, hostname, open, page404, middlewares } = site.options.server;
  const root = site.options.server.root || site.dest();
  const server = new Server({ root, port, hostname });

  server.addEventListener("start", () => {
    if (type === "build") {
      const ipAddr = localIp();

      log.info("  Server started at:");
      log.info(`  <green>http://${hostname}:${port}/</green> (local)`);

      if (ipAddr) {
        log.info(`  <green>http://${ipAddr}:${port}/</green> (network)`);
      }

      if (open) {
        openBrowser(`http://${hostname}:${port}/`);
      }
    }

    site.dispatchEvent({ type: "afterStartServer" });
  });

  if (log.level === 0) {
    server.use(logger());
  }

  server.use(
    reload({
      watcher: new SiteWatcher(site),
      basepath: site.options.location.pathname,
    }),
    noCache(),
    noCors(),
    notFound({
      root,
      page404,
      directoryIndex: true,
    }),
  );

  if (middlewares) {
    server.use(...middlewares);
  }

  server.start();
}
