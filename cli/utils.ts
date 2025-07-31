import lume from "../mod.ts";
import { toFileUrl } from "../deps/path.ts";
import { isUrl } from "../core/utils/path.ts";
import { getConfigFile } from "../core/utils/lume_config.ts";
import { log } from "../core/utils/log.ts";
import Site from "../core/site.ts";

/** Create a site instance */
export async function createSite(config?: string): Promise<Site> {
  let url: string | undefined;
  const watchInclude = [];

  if (config && isUrl(config)) {
    url = config;
  } else {
    const path = await getConfigFile(config);

    if (path) {
      watchInclude.push(path);
      url = toFileUrl(path).href;
    }
  }

  if (url) {
    log.info(`Loading config file <gray>${url}</gray>`);
    const mod = await import(url);
    const site = mod.default as Site | undefined;
    if (!(site instanceof Site)) {
      log.fatal(
        `[Lume] Missing Site instance! Ensure your config file does export the Site instance as default.`,
      );
      throw new Error("Site instance is not found");
    }

    site._data.configFile = url;
    site.options.watcher.include.push(...watchInclude);
    return site;
  }

  return lume();
}

/** Create a site intance and build it */
export async function buildSite(site: Site): Promise<void> {
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
}
