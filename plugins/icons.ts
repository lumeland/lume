import { catalogs } from "../deps/icons.ts";
import { readFile } from "../core/utils/read.ts";
import { merge } from "../core/utils/object.ts";
import { posix } from "../deps/path.ts";

import type Site from "../core/site.ts";
import type { Catalog, Variant } from "../deps/icons.ts";
export type { Catalog, Variant };

export interface Options {
  folder?: string;
  catalogs: Catalog[];
}

export const defaults: Options = {
  folder: "/icons",
  catalogs,
};

export function icons(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const icons = new Map<string, string>();
    site.filter("icon", icon);

    function icon(key: string, catalogId: string, rest?: string) {
      const catalog = catalogs.find((c) => c.id === catalogId);

      if (!catalog) {
        throw new Error(`Catalog "${catalogId}" not found`);
      }

      const [name, variant] = getNameAndVariant(catalog, key, rest);
      const file = iconPath(options.folder, catalog, name, variant);
      const url = iconUrl(catalog, name, variant);
      icons.set(file, url);
      return file;
    }

    site.addEventListener("afterRender", async () => {
      for (const [file, url] of icons) {
        const content = await readFile(url);
        const page = await site.getOrCreatePage(file);
        page.content = content;
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
      const first = catalog.variants[0];
      return [
        name,
        typeof first === "string" ? { id: first, path: first } : first,
      ];
    }

    return [name, undefined];
  }

  if (!catalog.variants) {
    throw new Error(`Catalog "${catalog.id}" does not support variants`);
  }

  const found = catalog.variants.find((v) => {
    return [name, typeof v === "string" ? v === variant : v.id === variant];
  });

  if (!found) {
    throw new Error(
      `Variant "${variant}" not found in catalog "${catalog.id}"`,
    );
  }

  return [
    name,
    typeof found === "string" ? { id: found, path: found } : found,
  ];
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
