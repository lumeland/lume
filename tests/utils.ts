import { assertStrictEquals } from "../deps/assert.ts";
import lume from "../mod.ts";
import { fromFileUrl, join, SEP } from "../deps/path.ts";
import { printError } from "../core/errors.ts";

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
