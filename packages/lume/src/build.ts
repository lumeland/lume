import { log } from "@lumeland/core/utils/log.ts";
import { resolveConfigFile } from "@lumeland/core/utils/lume_config.ts";
import { EmptyWriter } from "@lumeland/core/writer.ts";
// import { openInspector } from "@lumeland/deps/inspector.ts";
import { hmr } from "@lumeland/core/services/hmr.ts";
import { exit, setEnv, inspect } from "@lumeland/core/services/process.ts";
import { buildSite, createSite } from "./utils/site.ts";
import { envBoolean } from "@lumeland/core/utils/env.ts";
import { normalizePath } from "@lumeland/core/utils/path.ts";
import { fromFileUrl } from "deno-std/path/from_file_url.js";
import lumeCMS from "@lumeland/plugin-cms";
import { dev } from "@lumeland/plugin-dev";

import type Server from "@lumeland/core/server.ts";

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
  cms: loadCms,
  inspect: openInspector,
}: BuildOptions) {
  if (openInspector) {
    // TODO: openInspector();
  }

  if (serve || watch) {
    hmr();
    if (serve) {
      setEnv("LUME_LIVE_RELOAD", "true");
    }
  }

  const configFiles = {} as { site?: string; cms?: string };
  const _config = resolveConfigFile(["_config.ts", "_config.js"], config);

  if (_config) {
    configFiles.site = normalizePath(fromFileUrl(_config.href));
  }

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
  } else if (loadCms) {
    if (loadCms) {
      const _cms = resolveConfigFile(["_cms.ts", "_cms.js"]);

      if (_cms) {
        const { default: cms } = await import(_cms.href);
        site.use(lumeCMS({ cms }));
        configFiles.cms = normalizePath(fromFileUrl(_cms.href));
      }
    }
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
    site.use(dev({ serve, configFiles }));
  }

  log.output();
}
