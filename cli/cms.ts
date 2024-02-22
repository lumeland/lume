import { log } from "../core/utils/log.ts";
import { localIp } from "../core/utils/net.ts";
import { toFileUrl } from "../deps/path.ts";
import { getConfigFile } from "../core/utils/lume_config.ts";
import { setEnv } from "../core/utils/env.ts";
import { createSite } from "./run.ts";
import { adapter } from "../cms.ts";

export async function runCms(
  config: string | undefined,
) {
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

  const cms = mod.default;
  const app = await adapter({ site, cms });
  const { port } = site.options.server;
  const { basePath } = cms.options;

  Deno.serve({
    port,
    handler: app.fetch,
    onListen() {
      const ipAddr = localIp();

      log.info("  CMS server started at:");
      log.info(`  <green>http://localhost:${port}${basePath}</green> (local)`);

      if (ipAddr) {
        log.info(
          `  <green>http://${ipAddr}:${port}${basePath}</green> (network)`,
        );
      }
    },
  });
}
