import lume from "../mod.ts";
import { toFileUrl } from "../deps/path.ts";
import { dim } from "../deps/colors.ts";
import { getConfigFile, isUrl } from "../core/utils.ts";

import type { Site } from "../core.ts";

interface Options {
  config?: string;
}

export default function ({ config }: Options, ...scripts: string[]) {
  return run(config, scripts);
}

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
    console.log(`Loading config file ${dim(url)}`);
    console.log();
    const mod = await import(url);
    return mod.default;
  }

  return lume();
}
