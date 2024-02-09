import lume from "../mod.ts";
import { toFileUrl } from "../deps/path.ts";
import { isUrl } from "../core/utils/path.ts";
import { getConfigFile } from "../core/utils/lume_config.ts";
import { log } from "../core/utils/log.ts";

import type Site from "../core/site.ts";

/** Run one or more custom scripts */
export async function run(
  config: string | undefined,
  scripts: string[],
) {
  const site = await createSite(config);

  for (const script of scripts) {
    const success = await site.run(script);

    if (!success) {
      addEventListener("unload", () => Deno.exit(1));
      break;
    }
  }
}

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
    if (!mod.default) {
      log.critical(
        `[Lume] Missing Site instance! Ensure your config file does export the Site instance as default.`,
      );
      throw new Error("Site instance is not found");
    }
    return mod.default;
  }

  return lume();
}
