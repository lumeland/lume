import { log } from "../core/utils/log.ts";
import { localIp } from "../core/utils/net.ts";
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

interface BuildOptions {
  type: "build" | "rebuild";
  config?: string;
  serve?: boolean;
}

onmessage = async (event) => {
  const { type, config, serve } = event.data as BuildOptions;
  const site = await buildSite(config);

  // Set the live reload environment variable to add hash to the URLs in the module loader
  setEnv("LUME_LIVE_RELOAD", "true");

  // Start the watcher
  const watcher = site.getWatcher();
  const configFile = normalizePath(
    fromFileUrl(site._data.configFile as string),
    site.root(),
  );

  function mustReload(files: Set<string>): boolean {
    if (files.has(configFile)) {
      return true;
    }
    return false;
  }

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
  const { port, open, page404, middlewares } = site.options.server;
  const root = site.options.server.root || site.dest();
  const server = new Server({ root, port });

  server.addEventListener("start", () => {
    if (type === "build") {
      const ipAddr = localIp();

      log.info("  Server started at:");
      log.info(`  <green>http://localhost:${port}/</green> (local)`);

      if (ipAddr) {
        log.info(`  <green>http://${ipAddr}:${port}/</green> (network)`);
      }

      if (open) {
        const commands: Record<typeof Deno.build.os, string> = {
          darwin: "open",
          linux: "xdg-open",
          freebsd: "xdg-open",
          netbsd: "xdg-open",
          aix: "xdg-open",
          solaris: "xdg-open",
          illumos: "xdg-open",
          windows: "explorer",
          android: "xdg-open",
        };

        new Deno.Command(commands[Deno.build.os], {
          args: [`http://localhost:${port}/`],
          stdout: "inherit",
          stderr: "inherit",
        }).output();
      }
    }

    site.dispatchEvent({ type: "afterStartServer" });
  });

  if (log.level === 0) {
    server.use(logger());
  }

  server.use(
    reload({ watcher: new SiteWatcher(site) }),
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
};
