import { assertSnapshot } from "../deps/snapshot.ts";
import lume from "../mod.ts";
import { basename, fromFileUrl, join } from "../deps/path.ts";
import { DeepPartial } from "../core/utils/object.ts";

import type { Writer } from "../core/writer.ts";
import type { default as Site, SiteOptions } from "../core/site.ts";
import type { SourceMap } from "../plugins/source_maps.ts";

const cwUrl = import.meta.resolve("./");
const cwd = fromFileUrl(import.meta.resolve("./"));

export function getPath(path: string): string {
  return join(cwd, path);
}

class TestWriter implements Writer {
  savePages() {
    return Promise.resolve([]);
  }

  copyFiles() {
    return Promise.resolve([]);
  }

  clear() {
    return Promise.resolve();
  }

  removeFiles() {
    return Promise.resolve();
  }
}

/** Create a new lume site using the "assets" path as cwd */
export function getSite(
  options: DeepPartial<SiteOptions> = {},
  pluginOptions = {},
): Site {
  options.cwd = getPath("assets");

  const site = lume(options, pluginOptions, false);
  site.writer = new TestWriter();

  return site;
}

/** Returns a generated page by src path */
export function getPage(site: Site, path: string) {
  const page = site.pages.find((page) => page.src.path === path);

  if (!page) {
    throw new Error(`Page "${path}" not found`);
  }

  return page;
}

/** Build a site and print errors */
export async function build(site: Site) {
  try {
    await site.build();
  } catch (error) {
    console.error(Deno.inspect(error, { colors: true }));
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
    return content
      .replaceAll("\r\n", "\n")
      .replaceAll(/base64,[^"]+/g, "base64,(...)");
  }

  if (content instanceof Uint8Array) {
    if (options.avoidBinaryFilesLength) {
      return `Uint8Array()`;
    }
    return `Uint8Array(${content.length})`;
  }

  return `Array(${content.length})`;
}
function normalizeSourceMap(content: string) {
  const sourceMap: SourceMap = JSON.parse(content);
  sourceMap.sourceRoot = sourceMap.sourceRoot
    ? basename(sourceMap.sourceRoot)
    : undefined;
  sourceMap.file = sourceMap.file ? basename(sourceMap.file) : undefined;
  sourceMap.sources = sourceMap.sources.map((source: string) =>
    basename(source)
  );
  return JSON.stringify(sourceMap);
}

interface SiteSnapshotOptions {
  avoidBinaryFilesLength?: boolean;
}

export async function assertSiteSnapshot(
  context: Deno.TestContext,
  site: Site,
  options: SiteSnapshotOptions = {},
) {
  const { pages, files } = site;

  // To-do: test site configuration
  await assertSnapshot(
    context,
    {
      formats: Array.from(site.formats.entries.values()).map((format) => {
        return {
          ...format,
          engines: format.engines?.length,
        };
      }),
      src: Array.from(site.fs.entries.keys()).sort(),
    },
  );

  // Sort pages and files alphabetically
  pages.sort((a, b) =>
    compare(a.src.path, b.src.path) || compare(a.outputPath, b.outputPath)
  );
  files.sort((a, b) => compare(a.src.entry.path, b.src.entry.path));

  // Normalize data of the pages
  const normalizedPages = pages.map((page) => {
    const isSourceMap = page.outputPath.endsWith(".map");
    return {
      data: Object.fromEntries(
        Object.entries(page.data).map(([key, value]) => {
          switch (typeof value) {
            case "string":
              if (isSourceMap && key === "content") {
                return [key, normalizeSourceMap(value)];
              }
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
                return [key, [...value.keys()].sort(compare)];
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
        }).sort((a, b) => a[0].localeCompare(b[0])),
      ),
      content: isSourceMap
        ? normalizeSourceMap(page.content as string)
        : normalizeValue(page.content, options),
      src: {
        path: page.src.path,
        ext: page.src.ext,
        remote: page.src.entry?.flags.has("remote")
          ? page.src.entry.src.replace(cwUrl, "")
          : undefined,
        asset: page.asset,
      },
    };
  });

  const normalizedFiles = files.map((file) => {
    return {
      outputPath: file.outputPath,
      entry: file.src.entry.path,
      flags: [...file.src.entry.flags],
    };
  });

  // Test static files
  await assertSnapshot(context, normalizedFiles);
  await assertSnapshot(context, normalizedPages);
}

function compare(a: string, b: string): number {
  return a > b ? 1 : a < b ? -1 : 0;
}
