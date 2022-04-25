import { assertStrictEquals } from "../deps/assert.ts";
import { assertSnapshot } from "../deps/snapshot.ts";
import lume from "../mod.ts";
import { fromFileUrl, join, SEP } from "../deps/path.ts";
import { printError } from "../core/errors.ts";
import { normalizePath } from "../core/utils.ts";

import type { Page, Site, SiteOptions } from "../core.ts";

const cwd = fromFileUrl(new URL("./", import.meta.url));

export function getPath(path: string): string {
  return join(cwd, path);
}

/**
 * Convert a path to Posix or Win32
 * depending on de current platform.
 */
export function platformPath(path: string) {
  return path.replaceAll(/[\\/]+/g, SEP);
}

export function assertEqualsPaths(path1: unknown, path2: unknown) {
  if (typeof path1 === "string") {
    path1 = platformPath(path1);
  }
  if (typeof path2 === "string") {
    path2 = platformPath(path2);
  }
  assertStrictEquals(path1, path2);
}

/** Create a new lume site using the "assets" path as cwd */
export function getSite(
  options: Partial<SiteOptions> = {},
  pluginOptions = {},
  preventSave = true,
): Site {
  options.cwd = getPath("assets");
  options.quiet = true;

  const site = lume(options, pluginOptions, false);

  // Don't save the site to disk
  if (preventSave) {
    site.addEventListener("beforeSave", () => false);
  }

  return site;
}

/** Returns a generated page by src path */
export function getPage(site: Site, path: string) {
  path = platformPath(path);
  const page = site.pages.find((page) => page.src.path === path);

  if (!page) {
    throw new Error(`Page "${path}" not found`);
  }

  return page;
}

/** Check if page exist */
export function pageExists(site: Site, path: string) {
  path = platformPath(path);
  const page = site.pages.find((page) => page.src.path === path);
  return !!page;
}

/** Test a generated page by src path */
export function testPage(
  site: Site,
  path: string,
  test: (page: Page) => void | Promise<void>,
) {
  const page = getPage(site, path);

  return test(page);
}

/** Test a generated page by output url */
export function testUrlPage(
  site: Site,
  url: string,
  test: (page: Page) => void | Promise<void>,
) {
  const page = site.pages.find((page) => page.data.url === url);

  if (!page) {
    throw new Error(`Page "${url}" not found`);
  }

  return test(page);
}

/** Build a site and print errors */
export async function build(site: Site) {
  try {
    await site.build();
  } catch (error) {
    printError(error);
    throw error;
  }
}

/** Get the version of a dependency */
export async function getDepVersion(
  file: string,
  name: string,
): Promise<string | undefined> {
  const filepath = join(cwd, `../deps/${file}`);
  const content = await Deno.readTextFile(filepath);
  const match = content.match(`${name}@([^\/]+)`);

  if (match) {
    return match[1];
  }
}

function normalizeContent(
  content: string | Uint8Array | undefined,
): string | undefined {
  if (content instanceof Uint8Array) {
    return `Uint8Array(${content.length})`;
  }
  if (typeof content === "string") {
    // Normalize line ending for Windows
    return content
      .replaceAll("\r\n", "\n")
      .replaceAll(/base64,[^"]+/g, "base64,(...)");
  }
}

export async function assertPageSnapshot(
  context: Deno.TestContext,
  page: Page,
) {
  let { content, data } = page;
  const { dest } = page;
  const src = {
    path: normalizePath(page.src.path),
    ext: page.src.ext,
  };

  // Normalize content for Windows
  content = normalizeContent(content);
  data.content = normalizeContent(
    data.content as string | Uint8Array | undefined,
  );

  // Ignore comp object
  if (data.comp) {
    data.comp = true;
  }
  // Normalize date
  if (data.date instanceof Date) {
    data.date = new Date(0);
  }
  // Sort data alphabetically
  const entries = Object.entries(data).sort((a, b) => a[0].localeCompare(b[0]));
  data = Object.fromEntries(entries);

  await assertSnapshot(context, JSON.stringify({ src, dest, data, content }));
}

export async function assertSiteSnapshot(
  context: Deno.TestContext,
  site: Site,
) {
  const { pages } = site;

  // Test number of pages
  await assertSnapshot(context, pages.length);

  // To-do: test site configuration
  await assertSnapshot(context, JSON.stringify({
    formats: Array.from(site.formats.entries).map(([key, value]) => {
      return {
        key,
        pageType: value.pageType,
        includesPath: value.includesPath,
      };
    }),
  }));

  // Sort pages alphabetically
  pages.sort((a, b) => {
    const aPath = a.src.path;
    const bPath = b.src.path;
    return aPath > bPath ? 1 : aPath < bPath ? -1 : 0;
  });

  // Test each page
  for (const page of pages) {
    await assertPageSnapshot(context, page);
  }
}
