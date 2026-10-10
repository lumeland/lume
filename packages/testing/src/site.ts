import lume, { PluginOptions } from "@lumeland/lume";
import { EmptyWriter } from "@lumeland/core/writer.ts";

import type { default as Site, SiteOptions } from "@lumeland/core/site.ts";
import { inspect } from "@lumeland/core/services/process.ts";

/** Create a new lume site using the "assets" path as cwd */
export function getSite(
  options: SiteOptions = {},
  pluginOptions: PluginOptions = {},
  write = false,
): Site {
  const site = lume(options, pluginOptions, false);

  if (!write) {
    site.writer = new EmptyWriter();
  }

  return site;
}

interface SiteSnapshotOptions {
  avoidBinaryFilesLength?: boolean;
}

/** Build a site and print errors */
export async function build(site: Site, options?: SiteSnapshotOptions) {
  try {
    await site.build();
    return getSiteSnapshot(site, options);
  } catch (error) {
    console.error(inspect(error));
    throw error;
  }
}

function normalizeValue(
  content: unknown[] | Uint8Array | string | undefined,
  options: SiteSnapshotOptions,
): string {
  if (content === undefined) {
    return "undefined";
  }

  if (typeof content === "string") {
    // Normalize line ending for Windows
    return content.replaceAll("\r\n", "\n").replaceAll(/base64,[^"]+/g, "base64,(...)");
  }

  if (content instanceof Uint8Array) {
    if (options.avoidBinaryFilesLength) {
      return `Uint8Array(${content.length ? "" : 0})`;
    }
    return `Uint8Array(${content.length})`;
  }

  return `Array(${content.length})`;
}

function getSiteSnapshot(site: Site, options: SiteSnapshotOptions = {}) {
  // Get general site configuration
  const config = {
    formats: Array.from(site.formats.entries.values()).map((format) => {
      const fm = { ...format } as any;
      if (fm.engines) {
        fm.engines = fm.engines.length;
      }
      return fm;
    }),
    src: Array.from(site.fs.entries.keys()).sort(),
  };

  // Sort and normalize the data of the pages
  const pages = site.pages
    .sort((a, b) => a.outputPath.localeCompare(b.outputPath))
    .map((page) => ({
      data: Object.fromEntries(
        Object.entries(page.data)
          .map(([key, value]) => {
            switch (typeof value) {
              case "string":
                return [key, normalizeValue(value, options)];
              case "undefined":
                return [key, normalizeValue(value, options)];
              case "number":
              case "boolean":
                return [key, value];
              case "object":
                if (value === null) {
                  return [key, null];
                }
                if (Array.isArray(value) || value instanceof Uint8Array) {
                  return [key, normalizeValue(value, options)];
                }
                if (value instanceof Map || value instanceof Set) {
                  return [key, [...value.keys()].sort((a, b) => a.localeCompare(b))];
                }
                return [key, Object.keys(value)];
              case "function":
                return [key, value.name];
              case "symbol":
                return [key, value.toString()];
              case "bigint":
                return [key, `${value}n`];
              default:
                throw new Error(`Unknown type "${typeof value}"`);
            }
          })
          .sort((a, b) => (a[0] as string).localeCompare(b[0] as string)),
      ),
      content: normalizeValue(page.content, options),
      src: {
        path: page.src.path,
        ext: page.src.ext,
        remote: page.src.entry?.flags.has("remote") ? page.src.entry.src : undefined,
      },
    }));

  // Sort and normalize the data of the files
  const files = site.files
    .sort((a, b) => a.outputPath.localeCompare(b.outputPath))
    .map((file) => ({
      outputPath: file.outputPath,
      entry: file.src.entry.path,
      flags: [...file.src.entry.flags],
    }));

  return { config, pages, files };
}
