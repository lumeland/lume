import lume from "../mod.ts";
import { toFileUrl } from "../deps/path.ts";
import { isUrl } from "../core/utils/path.ts";
import { getConfigFile } from "../core/utils/lume_config.ts";
import { log } from "../core/utils/log.ts";
import Site from "../core/site.ts";

/** Create a site instance */
export async function createSite(config?: string): Promise<Site> {
  let url: string | undefined;

  if (config && isUrl(config)) {
    url = config;
  } else {
    const path = await getConfigFile(config);

    if (path) {
      url = toFileUrl(path).href;
    }
  }

  if (url) {
    log.info(`Loading config file <gray>${url}</gray>`);
    const mod = await import(url);
    const site = mod.default as Site | undefined;
    if (!(site instanceof Site)) {
      log.critical(
        `[Lume] Missing Site instance! Ensure your config file does export the Site instance as default.`,
      );
      throw new Error("Site instance is not found");
    }

    site._data.configFile = url;
    return site;
  }

  return lume();
}

/** Create a site intance and build it */
export async function buildSite(config?: string): Promise<Site> {
  const site = await createSite(config);

  performance.mark("start");
  await site.build();
  performance.mark("end");

  log.info(`🍾 Site built into <gray>${site.options.dest}</gray>`);
  const duration = performance.measure("duration", "start", "end").duration /
    1000;
  const total = site.pages.length + site.files.length;
  log.info(
    `  <gray>${total} files generated in ${duration.toFixed(2)} seconds</gray>`,
  );

  return site;
}
