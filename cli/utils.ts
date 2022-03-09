import lume from "../mod.ts";
import { exists } from "../deps/fs.ts";
import { join, resolve, toFileUrl } from "../deps/path.ts";
import { dim } from "../deps/colors.ts";
import { Exception } from "../core/errors.ts";

import type { Site } from "../core.ts";

/** Returns the _config file of a site */
export async function getConfigFile(
  root: string,
  config?: string,
): Promise<string | undefined> {
  root = resolve(Deno.cwd(), root);

  if (config) {
    const path = join(root, config);

    if (await exists(path)) {
      return path;
    }

    throw new Exception("Config file not found", { path });
  }

  const files = ["_config.js", "_config.ts"];

  for (const file of files) {
    const path = join(root, file);

    if (await exists(path)) {
      return path;
    }
  }
}

/** Create a site instance */
export async function createSite(root: string, config?: string): Promise<Site> {
  const path = await getConfigFile(root, config);

  if (path) {
    console.log(`Loading config file ${dim(path)}`);
    console.log();
    const mod = await import(toFileUrl(path).href);
    return mod.default;
  }

  return lume();
}

/** A list of the available optional plugins */
export const pluginNames = [
  "attributes",
  "base_path",
  "bundler",
  "code_highlight",
  "date",
  "esbuild",
  "eta",
  "imagick",
  "inline",
  "jsx",
  "liquid",
  "modify_urls",
  "netlify_cms",
  "on_demand",
  "parcel_css",
  "postcss",
  "pug",
  "relative_urls",
  "resolve_urls",
  "sass",
  "slugify_urls",
  "svgo",
  "terser",
];
