import { catalogs } from "../deps/icons.ts";
import { readFile } from "../core/utils/read.ts";
import { merge } from "../core/utils/object.ts";
import { posix } from "../deps/path.ts";
import { log } from "../core/utils/log.ts";

import type Site from "../core/site.ts";
import type { Catalog, Variant } from "../deps/icons.ts";
export type { Catalog, Variant };

export interface Options {
  /** The folder where the icons will be saved */
  folder?: string;

  /** The catalogs to use */
  catalogs?: Catalog[];
}

export const defaults: Options = {
  folder: "/icons",
  catalogs,
};

const commentRegexp = /<!--[\s\S]*?-->/;

export function icons(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const icons = new Map<string, string>();
    site.filter("icon", icon);

    function icon(key: string, catalogId: string, rest?: string) {
      const catalog = options.catalogs.find((c) => c.id === catalogId);

      if (!catalog) {
        log.warn(`[icons plugin] Catalog "${catalogId}" not found`);
        return key;
      }

      const [name, variant] = getNameAndVariant(catalog, key, rest);
      const file = iconPath(options.folder, catalog, name, variant);
      const url = iconUrl(catalog, name, variant);
      icons.set(file, url);
      return file;
    }

    site.process(async function processIcons() {
      for (const [file, url] of icons) {
        const content = await readFile(url);
        const page = await site.getOrCreatePage(file);
        page.content = content.replace(commentRegexp, ""); // Remove comment
      }
    });
  };
}

export default icons;

function iconPath(
  folder: string,
  catalog: Catalog,
  name: string,
  variant?: Variant,
): string {
  const file = `${catalog.id}/${name}${variant ? `-${variant.id}` : ""}.svg`;
  return posix.join("/", folder, file);
}

function getNameAndVariant(
  catalog: Catalog,
  name: string,
  variant?: string,
): [string, Variant | undefined] {
  if (!variant) {
    [name, variant] = name.split(":");
  }

  if (!variant) {
    if (catalog.variants) { // Returns the first variant
      return [name, getVariant(catalog.variants[0])];
    }

    return [name, undefined];
  }

  if (!catalog.variants) {
    log.warn(
      `[icons plugin] Catalog "${catalog.id}" does not support variants`,
    );
    return [name, undefined];
  }

  const found = catalog.variants.find((v) => {
    return typeof v === "string" ? v === variant : v.id === variant;
  });

  if (!found) {
    log.warn(
      `[icons plugin] Variant "${variant}" not found in catalog "${catalog.id}"`,
    );
    return [name, getVariant(catalog.variants[0])];
  }

  return [name, getVariant(found)];
}

function iconUrl(catalog: Catalog, name: string, variant?: Variant): string {
  if (catalog.name) {
    name = catalog.name(name, variant);
  }

  return catalog.src.replace("{name}", name).replace(
    "{variant}",
    variant ? variant.path : "",
  );
}

function getVariant(
  variant: string | Variant | undefined,
): Variant | undefined {
  if (!variant) {
    return undefined;
  }

  return typeof variant === "string" ? { id: variant, path: variant } : variant;
}
