import { SiteWatcher } from "@lumeland/core/watcher.ts";
import { normalizePath } from "@lumeland/core/utils/path.ts";
import { log } from "@lumeland/core/utils/log.ts";
import { inspect } from "@lumeland/core/services/process.ts";
import reload from "./reload.ts";
import noCache from "./no-cache.ts";
import noCors from "./no-cors.ts";
import { localIp, openBrowser } from "./utils/net.ts";
import { notFound } from "@lumeland/plugin-not-found";

import type Site from "@lumeland/core/site.ts";
import Path from "@lumeland/core/path.ts";

export interface DevOptions {
  /** True if requires to open a server */
  serve?: boolean;
}

/**
 * Plugin with utilities for a dev environment
 */
export function dev(options: DevOptions = {}) {
  return (site: Site) => {
    setupWatcher(site);

    if (options.serve) {
      setupServer(site);
    }
  };
}

export default dev;

function setupServer(site: Site) {
  const server = site.getServer();
  const { page404, open } = site.options.server;

  // Show server address info
  server.addEventListener(
    "start",
    () => {
      const ipAddr = localIp();

      log.info("\n  Server started at:");
      log.info(`  <green>http://${server.hostname}:${server.port}/</green> (local)`);

      if (ipAddr) {
        log.info(`  <green>http://${ipAddr}:${server.port}/</green> (network)`);
      }

      if (open) {
        void openBrowser(`http://${server.hostname}:${server.port}/`);
      }

      void site.dispatchEvent({ type: "afterStartServer" });
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
function setupWatcher(site: Site) {
  // Start the watcher
  const watcher = site.getWatcher();
  const src = Path.create(site.options.src);
  watcher.addEventListener("change", async (event) => {
    const files = new Set<string>();

    for (const f of event.files!) {
      const file = Path.create(f);

      if (src.contains(file)) {
        files.add(file.removeBase(src).toString());
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

  void watcher.start();
}
