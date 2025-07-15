import { log } from "../core/utils/log.ts";
import { localIp, openBrowser } from "../core/utils/net.ts";
import { setEnv } from "../core/utils/env.ts";
import { normalizePath } from "../core/utils/path.ts";
import { fromFileUrl } from "../deps/path.ts";
import { SiteWatcher } from "../core/watcher.ts";
import logger from "../middlewares/logger.ts";
import noCache from "../middlewares/no_cache.ts";
import noCors from "../middlewares/no_cors.ts";
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

    watcher.pause();
    return site.update(files).finally(() => watcher.resume());
  });

  watcher.addEventListener("error", (event) => {
    console.error(Deno.inspect(event.error, { colors: true }));
  });

  watcher.start();

  if (!serve) {
    return;
  }

  // Start the local server
  const server = site.getServer();
  const { port, hostname, open } = site.options.server;

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

  if (log.level < 5) {
    server.use(logger());
  }

  server.use(
    reload({
      watcher: new SiteWatcher(site),
      basepath: site.options.location.pathname,
      debugBar: site.debugBar,
    }),
    noCache(),
    noCors(),
  );

  server.start();
}
