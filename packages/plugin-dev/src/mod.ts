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
  configFiles?: {
    site?: string;
    cms?: string;
  };
}

/**
 * Plugin with utilities for a dev environment
 */
export function dev(options: DevOptions = {}) {
  return (site: Site) => {
    setupWatcher(site, Object.values(options.configFiles ?? {}).filter(Boolean));

    if (options.serve) {
      setupServer(site, !!options.configFiles?.cms);
    }
  };
}

export default dev;

function setupServer(site: Site, hasCms: boolean) {
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

      if (hasCms) {
        log.info("\n  LumeCMS started at:");

        log.info(`  <green>http://${hostname}:${port}/admin</green> (local)`);

        if (ipAddr) {
          log.info(`  <green>http://${ipAddr}:${port}/admin</green> (network)`);
        }
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
function setupWatcher(site: Site, reloadFiles: string[]) {
  // Start the watcher
  const watcher = site.getWatcher();
  const src = normalizePath(site.options.src);
  watcher.addEventListener("change", async (event) => {
    const files = new Set<string>();

    for (const file of event.files!) {
      // Config file. Reload the process
      if (reloadFiles.includes(site.root(file))) {
        log.info("Reloading the site...");
        log.output();
        return reloadProcess();
      }

      // Not in the src folder
      if (!file.startsWith(src)) {
        continue;
      }

      if (src !== "/") {
        files.add(file.slice(src.length));
      } else {
        files.add(file);
      }
    }

    log.info("Changes detected:");
    files.forEach((file) => {
      log.info(`- <gray>${file}</gray>`);
    });

    await site.update(files);
    log.output();
  });

  watcher.addEventListener("error", (event) => {
    console.error(inspect(event.error));
  });

  watcher.start();
}
