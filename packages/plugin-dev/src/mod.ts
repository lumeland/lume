import { SiteWatcher } from "@lumeland/core/watcher.ts";
import { log } from "@lumeland/core/utils/log.ts";
import reload from "./reload.ts";
import noCache from "./no_cache.ts";
import noCors from "./no_cors.ts";
import { localIp, openBrowser } from "./utils/net.ts";
import { notFound } from "@lumeland/plugin-not-found";

import type Site from "@lumeland/core/site.ts";

/**
 * A plugin to add some middlewares useful for development
 */
export function dev() {
  return (site: Site) => {
    const server = site.getServer();

    const { port, hostname, page404, open } = site.options.server;

    // Show server address info
    server.addEventListener("start", () => {
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
    }, { once: true });

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
    server.use(notFound({
      root: server.options.root,
      page404,
      directoryIndex: true,
    }),)
  };
}

export default dev;
