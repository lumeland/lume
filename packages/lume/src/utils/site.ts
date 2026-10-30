import lume from "../mod.ts";
import { log } from "@lumeland/core/utils/log.ts";
import { realPathSync } from "@lumeland/core/services/fs.ts";
import { toFileUrl } from "../../deps/path.ts";
import { isUrl } from "@lumeland/core/utils/path.ts";

import type Site from "@lumeland/core/site.ts";

/** Create a site instance */
export async function createSite(_config?: URL): Promise<Site> {
  if (!_config) {
    return lume();
  }

  log.info(`Loading config file <gray>${_config}</gray>`);
  const mod = await import(_config.toString());
  const site = mod.default as Site;
  return site;
}

/** Create a site intance and build it */
export async function buildSite(site: Site): Promise<void> {
  performance.mark("start");
  await site.build();
  performance.mark("end");

  log.info(`🍾 Site built into <gray>${site.options.dest}</gray>`);
  const duration = performance.measure("duration", "start", "end").duration / 1000;
  const total = site.pages.length + site.files.length;
  log.info(`  <gray>${total} files generated in ${duration.toFixed(2)} seconds</gray>`);
}

/** Resolve a configuration file */
export function resolveConfigFile(defaultPaths: string[], customPath?: string): URL | undefined {
  if (customPath) {
    if (isUrl(customPath)) {
      return new URL(customPath);
    }

    try {
      const file = realPathSync(customPath);
      return toFileUrl(file);
    } catch {
      throw new Error(`Config file not found (${customPath})`);
    }
  }

  for (const path of defaultPaths) {
    try {
      const file = realPathSync(path);
      return toFileUrl(file);
    } catch {
      // Ignore
    }
  }
}
