import { log } from "../core/utils/log.ts";
import { localIp } from "../core/utils/net.ts";
import { toFileUrl } from "../deps/path.ts";
import { getConfigFile } from "../core/utils/lume_config.ts";
import { normalizePath } from "../core/utils/path.ts";
import { fromFileUrl } from "../deps/path.ts";
import { setEnv } from "../core/utils/env.ts";
import { createSite } from "./utils.ts";

interface CMSOptions {
  type: "build" | "rebuild";
  config?: string;
}

onmessage = async (event) => {
  const { type, config } = event.data as CMSOptions;

  const site = await createSite(config);
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

  function mustReload(files: Set<string>): boolean {
    if (files.has(_config) || files.has(_cms)) {
      return true;
    }
    return false;
  }

  site.addEventListener("beforeUpdate", (ev) => {
    if (mustReload(ev.files)) {
      log.info("Reloading the site...");
      postMessage({ type: "reload" });
      return;
    }
  });

  Deno.serve({
    port,
    handler: app.fetch,
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
};
