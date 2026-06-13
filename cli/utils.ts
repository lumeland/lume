import lume from "../mod.ts";
import { log } from "../core/utils/log.ts";
import Site from "../core/site.ts";
import { Data } from "../core/file.ts";

/** Create a site instance */
export async function createSite<D extends Data>(
  _config?: URL,
): Promise<Site<D>> {
  if (!_config) {
    return lume() as unknown as Site<D>;
  }
  log.info(`Loading config file <gray>${_config}</gray>`);
  const mod = await import(_config.toString());
  const site = mod.default as Site<D> | undefined;
  if (!(site instanceof Site)) {
    log.fatal(
      `[Lume] Missing Site instance! Ensure your config file does export the Site instance as default.`,
    );
    throw new Error("Site instance is not found");
  }
  return site;
}

/** Create a site intance and build it */
export async function buildSite<D extends Data>(site: Site<D>): Promise<void> {
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
