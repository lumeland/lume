import { log } from "../core/utils/log.ts";
import { localIp, openBrowser } from "../core/utils/net.ts";
import { env, setEnv } from "../core/utils/env.ts";
import { normalizePath } from "../core/utils/path.ts";
import { resolveConfigFile } from "../core/utils/lume_config.ts";
import { fromFileUrl } from "../deps/path.ts";
import { SiteWatcher } from "../core/watcher.ts";
import logger from "../middlewares/logger.ts";
import noCache from "../middlewares/no_cache.ts";
import noCors from "../middlewares/no_cors.ts";
import reload from "../middlewares/reload.ts";
import { buildSite, createSite } from "./utils.ts";
import { initLocalStorage } from "./missing_worker_apis.ts";
import lumeCMS from "../plugins/lume_cms.ts";
import type Server from "../core/server.ts";

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

async function build({ type, config, serve, cms: loadCms }: BuildOptions) {
  // Set the live reload environment variable to add hash to the URLs in the module loader
  setEnv("LUME_LIVE_RELOAD", "true");

  // Show draft pages in development mode (if not set already)
  const showDrafts = env<boolean | undefined>("LUME_DRAFTS");
  if (showDrafts === undefined) {
    setEnv("LUME_DRAFTS", "true");
  }

  const _config = await resolveConfigFile(["_config.ts", "_config.js"], config);
  const site = await createSite(_config);
  let server: Server | undefined;

  // Start the server and show the wait page while building the first time
  if (serve) {
    server = site.getServer();
    server.waitHandler = (request) => Promise.resolve(createWaitResponse(request.url));
    server.start();
  }
  await new Promise((resolve) => setTimeout(resolve, 10000));

  // Setup LumeCMS
  let _cms: URL | undefined;
  // deno-lint-ignore no-explicit-any
  let cms: any;

  if (loadCms) {
    _cms = await resolveConfigFile(["_cms.ts", "_cms.js"]);

    if (_cms) {
      const isProduction = env<boolean>("LUME_PROXIED");
      const mod = await import(_cms.toString());
      cms = mod.default;
      site.use(lumeCMS({
        cms,
        protectSite: isProduction,
      }));
    }
  }

  // Include the config files to the watcher
  const reloadFiles: string[] = [];
  if (_config) {
    reloadFiles.push(normalizePath(fromFileUrl(_config), site.root()));
    site.options.watcher.include.push(fromFileUrl(_config));
  }
  if (_cms) {
    reloadFiles.push(normalizePath(fromFileUrl(_cms), site.root()));
    site.options.watcher.include.push(fromFileUrl(_cms));
  }

  try {
    await buildSite(site);
  } catch (error) {
    console.error(Deno.inspect(error, { colors: true }));
  }

  // Start the watcher
  const watcher = site.getWatcher();

  watcher.addEventListener("change", (event) => {
    const files = event.files!;

    log.info("Changes detected:");
    files.forEach((file) => {
      log.info(`- <gray>${file}</gray>`);
    });

    // If the config files have changed, reload the build process
    if (reloadFiles.some((file) => files.has(file))) {
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

  if (!server) {
    return;
  }

  // Start the local server
  const { port, hostname, open } = site.options.server;

  if (log.level < 5) {
    server.use(logger());
  }

  server.useFirst(
    reload({
      watcher: new SiteWatcher(site),
      basepath: site.options.location.pathname,
      debugBar: site.debugBar,
    }),
    noCache(),
    noCors(),
  );

  // Add the reload middleware
  server.useFirst(async (request, next) => {
    const response = await next(request);

    // Reload if the response header tells us to
    if (response.headers.get("X-Lume-CMS") === "reload") {
      log.info("Reloading the site...");
      const url = response.headers.get("Location") || request.url;
      postMessage({ type: "reload" });
      return createWaitResponse(url);
    }

    return response;
  });

  if (type === "build") {
    const ipAddr = localIp();

    log.info("\n  Server started at:");
    log.info(`  <green>http://${hostname}:${port}/</green> (local)`);

    if (ipAddr) {
      log.info(`  <green>http://${ipAddr}:${port}/</green> (network)`);
    }

    if (cms) {
      log.info("\n  LumeCMS started at:");
      const { basePath } = cms.options;
      log.info(
        `  <green>http://${hostname}:${port}${basePath}</green> (local)`,
      );

      if (ipAddr) {
        log.info(
          `  <green>http://${ipAddr}:${port}${basePath}</green> (network)`,
        );
      }
    }

    if (open) {
      openBrowser(`http://${hostname}:${port}/`);
    }
  }

  site.dispatchEvent({ type: "afterStartServer" });
  server.waitHandler = undefined;
}

function createWaitResponse(url: string): Response {
  return new Response(
    `<html>
    <head>
      <meta charset="utf-8">
      <title>Agarde…</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
      body {
        font-family: system-ui, sans-serif;
        margin: 0;
        padding: 2rem;
        box-sizing: border-box;
        display: grid;
        grid-template-columns: minmax(0, 800px);
        align-content: center;
        justify-content: center;
        min-height: 100vh
      }
      </style>
    </head>
    <body>
    <pre><samp>Please wait…\n</samp></pre>
    <script type="module">
      const samp = document.querySelector("samp");
      const timeout = 1000;
      while (true) {
        try {
          const response = await fetch("${url}");
          if (response.headers.get("X-Lume-CMS") !== "reload") {
            document.location = "${url}";
            break;
          }
        } catch {}

        samp.textContent += ".";
        await new Promise((resolve) => setTimeout(resolve, timeout));
      }
    </script>
    </body>
    </html>`,
    {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        "X-Lume-CMS": "reload",
        "X-Lume-Location": url,
      },
    },
  );
}
