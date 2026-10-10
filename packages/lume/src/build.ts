import { log } from "@lumeland/core/utils/log.ts";
import { resolveConfigFile } from "@lumeland/core/utils/lume_config.ts";
import { EmptyWriter } from "@lumeland/core/writer.ts";
// import { openInspector } from "@lumeland/deps/inspector.ts";
import { hmr } from "@lumeland/core/services/hmr.ts";
import { exit, setEnv, inspect } from "@lumeland/core/services/process.ts";
import { buildSite, createSite } from "./utils/site.ts";
import { envBoolean } from "@lumeland/core/utils/env.ts";
import { notFound } from "@lumeland/plugin-not-found";
import { normalizePath } from "@lumeland/core/utils/path.ts";
import dev from "@lumeland/plugin-dev";

import type Server from "@lumeland/core/server.ts";
import { localIp, openBrowser } from "./utils/net.ts";

export interface BuildOptions {
  config: string | undefined;
  serve?: boolean;
  watch?: boolean;
  cms?: boolean;
  dryRun?: boolean;
  inspect?: boolean;
}

/** Build the website and optionally watch changes and serve the site */
export async function build({
  config,
  serve,
  watch,
  dryRun,
  inspect: openInspector,
}: BuildOptions) {
  if (openInspector) {
    // openInspector();
  }

  if (serve || watch) {
    hmr();
    if (serve) {
      setEnv("LUME_LIVE_RELOAD", "true");
    }
  }

  const _config = resolveConfigFile(["_config.ts", "_config.js"], config);

  // Show draft pages in development mode (if not set already)
  const showDrafts = envBoolean("LUME_DRAFTS");
  if (showDrafts === undefined) {
    setEnv("LUME_DRAFTS", "true");
  }

  let server: Server | undefined;
  const site = await createSite(_config);

  // Start the server and show the wait page while building the first time
  if (serve) {
    server = site.getServer();
    server.wait();
    log.info(`Web server started at http://${server.hostname}:${server.port}/`);
  }

  log.info("Preparing to build the site");

  if (dryRun) {
    site.writer = new EmptyWriter();
  }

  try {
    await buildSite(site);
  } catch (error) {
    console.error(inspect(error));
  }

  if (dryRun && log.hasErrors) {
    log.output();
    exit(1);
  }

  if (server || watch) {
    // Start the watcher
    const watcher = site.getWatcher();
    const srcFolder = normalizePath(site.options.src);

    watcher.addEventListener("change", async (event) => {
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

  // Start the local server
  if (server) {
    const { port, hostname, page404, open } = site.options.server;

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
    });

    server.use(
      notFound({
        root: server.options.root,
        page404,
        directoryIndex: true,
      }),
    );

    site.use(dev());

    server.start();
  }

  log.output();
}
