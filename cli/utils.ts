import lume from "../mod.ts";
import { log } from "../core/utils/log.ts";
import Site from "../core/site.ts";

/** Create a site instance */
export async function createSite(_config?: URL): Promise<Site> {
  if (!_config) {
    return lume();
  }
  log.info(`Loading config file <gray>${_config}</gray>`);
  const mod = await import(_config.toString());
  const site = mod.default as Site | undefined;
  if (!(site instanceof Site)) {
    log.fatal(
      `[Lume] Missing Site instance! Ensure your config file does export the Site instance as default.`,
    );
    throw new Error("Site instance is not found");
  }
  return site;
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
