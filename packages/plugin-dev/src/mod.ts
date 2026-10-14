import { SiteWatcher } from "@lumeland/core/watcher.ts";
import { normalizePath } from "@lumeland/core/utils/path.ts";
import { log } from "@lumeland/core/utils/log.ts";
import { inspect, reloadProcess } from "@lumeland/core/services/process.ts";
import reload from "./reload.ts";
import noCache from "./no_cache.ts";
import noCors from "./no_cors.ts";
import { localIp, openBrowser } from "./utils/net.ts";
import { notFound } from "@lumeland/plugin-not-found";

import type Site from "@lumeland/core/site.ts";

export interface DevOptions {
  serve?: boolean;
  reloadFiles?: string[];
}

/**
 * Plugin with utilities for a dev environment
 */
export function dev(options: DevOptions = {}) {
  return (site: Site) => {
    setupWatcher(site, options.reloadFiles);

    if (options.serve) {
      setupServer(site);
    }
  };
}

export default dev;

function setupServer(site: Site) {
  const server = site.getServer();
  const { port, hostname, page404, open } = site.options.server;

  // Show server address info
  server.addEventListener(
    "start",
    () => {
      const ipAddr = localIp();

      log.info("\n  Server started at:");
      log.info(`  <green>http://${hostname}:${port}/</green> (local)`);

      if (ipAddr) {
        log.info(`  <green>http://${ipAddr}:${port}/</green> (network)`);
      }

      if (open) {
        openBrowser(`http://${hostname}:${port}/`);
      }

      site.dispatchEvent({ type: "afterStartServer" });
    },
    { once: true },
  );

  // Live reload
  server.useFirst(
    reload({
      watcher: new SiteWatcher(site),
      basepath: site.options.location.pathname,
      debugBar: site.debugBar,
      server,
    }),
    noCache(),
    noCors(),
  );

  // Not found page
  server.use(
    notFound({
      root: server.options.root,
      page404,
      directoryIndex: true,
    }),
  );

  server.start();
}

/** Setup a file watcher */
function setupWatcher(site: Site, reloadFiles?: string[]) {
  // Start the watcher
  const watcher = site.getWatcher();
  const srcFolder = normalizePath(site.options.src);

  watcher.addEventListener("change", async (event) => {
    const files = event.files!;

    // If the config files have changed, reload the build process
    if (reloadFiles?.some((file) => files.has(file))) {
      log.info("Reloading the site...");
      log.output();
      return reloadProcess();
    }

    const srcFiles = new Set(
      [...event.files!]
        .filter((file) => file.startsWith(srcFolder))
        .map((file) => (srcFolder === "/" ? file : file.slice(srcFolder.length))),
    );

    log.info("Changes detected:");
    srcFiles.forEach((file) => {
      log.info(`- <gray>${file}</gray>`);
    });

    await site.update(srcFiles);
    log.output();
  });

  watcher.addEventListener("error", (event) => {
    console.error(inspect(event.error));
  });

  watcher.start();
}
