import { assertSnapshot } from "../deps/snapshot.ts";
import lume from "../mod.ts";
import { basename, fromFileUrl, join } from "../deps/path.ts";
import { printError } from "../core/errors.ts";
import { DeepPartial } from "../core/utils.ts";

import type { Site, SiteOptions, SourceMap } from "../core.ts";

const cwUrl = import.meta.resolve("./");
const cwd = fromFileUrl(import.meta.resolve("./"));

export function getPath(path: string): string {
  return join(cwd, path);
}

/** Create a new lume site using the "assets" path as cwd */
export function getSite(
  options: DeepPartial<SiteOptions> = {},
  pluginOptions = {},
): Site {
  options.cwd = getPath("assets");
  options.quiet = true;

  const site = lume(options, pluginOptions, false);

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
  // Don't save the site to disk
  site.addEventListener("beforeSave", () => false);

  try {
    await site.build();
  } catch (error) {
    printError(error);
    throw error;
  }
}

function normalizeValue(
  content: unknown[] | Uint8Array | string | undefined,
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

export async function assertSiteSnapshot(
  context: Deno.TestContext,
  site: Site,
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
    },
  );

  // Sort pages and files alphabetically
  pages.sort((a, b) =>
    compare(a.src.path, b.src.path) || compare(a.outputPath!, b.outputPath!)
  );
  files.sort((a, b) => compare(a.entry.path, b.entry.path));

  // Normalize data of the pages
  const normalizedPages = pages.map((page) => {
    const isSourceMap = page.outputPath?.endsWith(".map");
    return {
      data: Object.fromEntries(
        Object.entries(page.data).map(([key, value]) => {
          switch (typeof value) {
            case "string":
              if (isSourceMap && key === "content") {
                return [key, normalizeSourceMap(value)];
              }
              return [key, normalizeValue(value)];
            case "undefined":
              return [key, normalizeValue(value)];
            case "number":
            case "boolean":
              return [key, value];
            case "object":
              if (value === null) {
                return [key, null];
              }
              if (Array.isArray(value) || value instanceof Uint8Array) {
                return [key, normalizeValue(value)];
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
        : normalizeValue(page.content),
      src: {
        path: page.src.path,
        ext: page.src.ext,
        remote: page.src.remote?.replace(cwUrl, ""),
        asset: page.src.asset,
        slug: page.src.slug,
      },
    };
  });

  const normalizedFiles = files.map((file) => {
    return {
      ...file,
      entry: file.entry.path,
      flags: [...file.entry.flags],
    };
  });

  // Test static files
  await assertSnapshot(context, normalizedFiles);
  await assertSnapshot(context, normalizedPages);
}

function compare(a: string, b: string): number {
  return a > b ? 1 : a < b ? -1 : 0;
}
