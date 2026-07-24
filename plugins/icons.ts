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

  /** The sprite file where icons will be saved */
  spriteFile?: string;

  /** The catalogs to use */
  catalogs?: Catalog[];
}

export const defaults = {
  folder: "/icons",
  spriteFile: "/icons.svg",
  catalogs,
} satisfies Options;

export function icons(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return <D>(site: Site<D>) => {
    const iconFiles = new Map<string, string>();
    const iconSprite = new Map<string, string>();

    site.filter("icon", icon.bind(undefined, false));
    site.filter("spriteIcon", icon.bind(undefined, true));

    function icon(
      sprite: boolean,
      key: string,
      catalogId: string,
      rest?: string,
    ) {
      const catalog = options.catalogs.find((c) => c.id === catalogId);

      if (!catalog) {
        log.warn(`[icons plugin] Catalog "${catalogId}" not found`);
        return key;
      }

      const [name, variant] = getNameAndVariant(catalog, key, rest);

      const url = iconUrl(catalog, name, variant);
      let file;

      if (sprite) {
        const id = iconId(catalog, name, variant);
        iconSprite.set(id, url);
        file = `${options.spriteFile}#${id}`;
      } else {
        file = iconPath(options.folder, catalog, name, variant);
        iconFiles.set(file, url);
      }

      return file;
    }

    site.process(async function processIcons() {
      // Generate icon sprite

      if (iconSprite.size) {
        let sprite =
          `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n`;

        for (const [id, url] of iconSprite) {
          const icon = await readFile(url);
          sprite += `${processSvg(icon, id)}\n`;
        }

        sprite += "</svg>";

        const page = await site.getOrCreatePage(options.spriteFile);
        page.content = sprite;
      }

      // Generate icon files

      for (const [file, url] of iconFiles) {
        const content = await readFile(url);
        const page = await site.getOrCreatePage(file);
        page.content = processSvg(content);
      }
    });

    site.addEventListener("beforeUpdate", () => {
      iconSprite.clear();
      iconFiles.clear();
    });
  };
}

export default icons;

function iconId(catalog: Catalog, name: string, variant?: Variant): string {
  return `${catalog.id}-${name}${variant ? `-${variant.id}` : ""}`;
}

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

  const found = catalog.variants.find((v) =>
    typeof v === "string" ? v === variant : v.id === variant
  );

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

const commentRegexp = /<!--[\s\S]*?-->/;

function processSvg(code: string, id?: string): string {
  // Remove comment
  code = code.replace(commentRegexp, "").trim();

  let [start] = code.match(/^<svg((?:\s+[\w-]+="[^"]*")*)\s*>/) ?? [];

  if (!start) {
    return code;
  }

  const startLen = start.length;

  // Ensure viewBox is defined
  if (!start.includes(" viewBox=")) {
    const width = start.match(/\swidth="(\d+)"/);
    const height = start.match(/\sheight="(\d+)"/);

    if (width && height) {
      const viewBox = `viewBox="0 0 ${width[1]} ${height[1]}"`;
      start = start.replace(/^<svg\s+/, `<svg ${viewBox} `);
    }
  }

  if (id) {
    // ID is set, therefore `<symbol>` is generated.

    start = start.replaceAll(
      /\s+(xmlns|version|id|width|height)="[^"]*"/g,
      " ",
    );
    start = start.replace(/^<svg\s+/, `<symbol id="${id}" `);
    start = start.replace(/\s*>$/, ">");

    code = `${start}${code.slice(startLen)}`;
    code = code.replace(/<\/svg>\s*$/, "</symbol>");
  } else {
    code = `${start}${code.slice(startLen)}`;
  }

  return code;
}

/** Extends Helpers interface */
declare global {
  namespace Lume {
    export interface Helpers {
      /** @see https://lume.land/plugins/icons/ */
      icon: (key: string, catalogId: string, rest?: string) => string;

      /** @see https://lume.land/plugins/icons/ */
      spriteIcon: (key: string, catalogId: string, rest?: string) => string;
    }
  }
}
