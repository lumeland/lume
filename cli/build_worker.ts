import { log } from "../core/utils/log.ts";
import { localIp, openBrowser } from "../core/utils/net.ts";
import { setEnv } from "../core/utils/env.ts";
import { normalizePath } from "../core/utils/path.ts";
import { getConfigFile } from "../core/utils/lume_config.ts";
import { fromFileUrl, toFileUrl } from "../deps/path.ts";
import { SiteWatcher } from "../core/watcher.ts";
import logger from "../middlewares/logger.ts";
import noCache from "../middlewares/no_cache.ts";
import noCors from "../middlewares/no_cors.ts";
import reload from "../middlewares/reload.ts";
import { buildSite, createSite } from "./utils.ts";
import { initLocalStorage } from "./missing_worker_apis.ts";
import lumeCMS from "../plugins/lume_cms.ts";

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
  cms?: boolean;
}

async function build({ type, config, serve, cms }: BuildOptions) {
  // Set the live reload environment variable to add hash to the URLs in the module loader
  setEnv("LUME_LIVE_RELOAD", "true");

  const site = await createSite(config);

  // Set the CMS environment variable if requested
  if (cms) {
    const cmsConfig = await getConfigFile(undefined, ["_cms.ts", "_cms.js"]);

    if (!cmsConfig) {
      throw new Error("CMS config file not found");
    }

    const mod = await import(toFileUrl(cmsConfig).href);

    // Add the CMS config file to the watcher
    site.options.watcher.include.push(cmsConfig);
    site.use(lumeCMS({ cms: mod.default }));
  }

  await buildSite(site);

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

  // Add the reload middleware
  server.useFirst(async (request, next) => {
    const response = await next(request);

    // Reload if the response header tells us to
    if (response.headers.get("X-Lume-CMS") === "reload") {
      log.info("Reloading the site...");
      const url = response.headers.get("Location") || request.url;
      postMessage({ type: "reload" });
      return getWaitResponse(url);
    }

    return response;
  });

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

function getWaitResponse(url: string): Response {
  return new Response(
    `<html>
    <head>
      <title>Rebuilding site…</title>
      <style>body{font-family:sans-serif;margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh}</style>
    </head>
    <body>
    <p>The site is being rebuilt. This page will reload automatically when it's ready.</p>
    <script type="module">
      let timeout = 0;
      while (true) {
        try {
          await fetch("${url}");
          document.location = "${url}";
          break;
        } catch {
          timeout = Math.min(timeout + 1000, 10000);
          await new Promise((resolve) => setTimeout(resolve, timeout));
        }
      }
    </script>
    </body>
    </html>`,
    {
      status: 200,
      headers: { "content-type": "text/html" },
    },
  );
}
