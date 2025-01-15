import { log } from "../core/utils/log.ts";
import { localIp } from "../core/utils/net.ts";
import { toFileUrl } from "../deps/path.ts";
import { getConfigFile } from "../core/utils/lume_config.ts";
import { normalizePath } from "../core/utils/path.ts";
import { fromFileUrl } from "../deps/path.ts";
import { setEnv } from "../core/utils/env.ts";
import { createSite } from "./utils.ts";
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

interface CMSOptions {
  type: "build" | "rebuild";
  config?: string;
}

async function build({ type, config }: CMSOptions) {
  const cmsConfig = await getConfigFile(undefined, ["_cms.ts", "_cms.js"]);

  if (!cmsConfig) {
    throw new Error("CMS config file not found");
  }

  const mod = await import(toFileUrl(cmsConfig).href);

  if (!mod.default) {
    throw new Error("CMS instance is not found");
  }

  // Enable drafts in the CMS
  setEnv("LUME_DRAFTS", "true");
  setEnv("LUME_CMS", "true");

  const site = await createSite(config);

  // Add the CMS config file to the watcher
  site.options.watcher.include.push(cmsConfig);

  const { default: adapter } = await import("lume/cms/adapters/lume.ts");
  const cms = mod.default;
  const app = await adapter({ site, cms });
  const { port } = site.options.server;
  const { basePath } = cms.options;

  const _cms = normalizePath(cmsConfig, site.root());
  const _config = normalizePath(
    fromFileUrl(site._data.configFile as string),
    site.root(),
  );

  const mustReload = (files: Set<string>): boolean =>
    files.has(_config) || files.has(_cms);

  site.addEventListener("beforeUpdate", (ev) => {
    if (mustReload(ev.files)) {
      log.info("Reloading the site...");
      postMessage({ type: "reload" });
      return;
    }
  });

  Deno.serve({
    port,
    async handler(request) {
      const response = await app.fetch(request);
      // Reload if the response header tells us to
      if (response.headers.get("X-Lume-CMS") === "reload") {
        log.info("Reloading the site...");
        postMessage({ type: "reload" });
        return getWaitResponse(`http://localhost:${port}${basePath}`);
      }
      return response;
    },
    onListen() {
      if (type === "build") {
        const ipAddr = localIp();

        log.info("  CMS server started at:");
        log.info(
          `  <green>http://localhost:${port}${basePath}</green> (local)`,
        );

        if (ipAddr) {
          log.info(
            `  <green>http://${ipAddr}:${port}${basePath}</green> (network)`,
          );
        }
      }
    },
  });
}

function getWaitResponse(url: string): Response {
  return new Response(
    `<html>
    <head>
      <title>Please wait...</title>
      <style>body{font-family:sans-serif;margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh}</style>
    </head>
    <body>
    <p>Please wait...</p>
    <script type="module">
      // Wait for the server to start
      let timeout = 0;
      while (true) {
        try {
          await fetch("${url}");
          document.location = "${url}";
          break;
        } catch {
          timeout += 1000;
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
